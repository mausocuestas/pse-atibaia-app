import { describe, it, expect, vi } from 'vitest';
import { redirect } from '@sveltejs/kit';
import { load } from '../+page.server';

// Mock the redirect function
vi.mock('@sveltejs/kit', () => ({
	redirect: vi.fn((status: number, location: string) => {
		const error = new Error('Redirect') as any;
		error.status = status;
		error.location = location;
		throw error;
	})
}));

describe('dashboard/+page.server.ts', () => {
	describe('load function', () => {
		it('should redirect when session is missing', async () => {
			const mockEvent = {
				locals: {
					auth: vi.fn().mockResolvedValue(null)
				}
			} as any;

			await expect(load(mockEvent)).rejects.toMatchObject({
				status: 303,
				location: '/'
			});

			expect(mockEvent.locals.auth).toHaveBeenCalledOnce();
		});

		it('should redirect when user is missing from session', async () => {
			const mockEvent = {
				locals: {
					auth: vi.fn().mockResolvedValue({ expires: '2024-12-31' })
				}
			} as any;

			await expect(load(mockEvent)).rejects.toMatchObject({
				status: 303,
				location: '/'
			});

			expect(mockEvent.locals.auth).toHaveBeenCalledOnce();
		});

		it('should return user data when session exists', async () => {
			const mockSession = {
				user: {
					email: 'test@example.com',
					name: 'Test User',
					profissional_id: 1,
					avaliador_id: 2,
					usf_id: 3,
					nome_profissional: 'Dr. Test'
				},
				expires: '2024-12-31'
			};

			const mockEvent = {
				locals: {
					auth: vi.fn().mockResolvedValue(mockSession)
				}
			} as any;

			const result = await load(mockEvent);

			expect(result).toEqual({
				user: {
					name: 'Test User',
					email: 'test@example.com',
					nome_profissional: 'Dr. Test',
					avaliador_id: 2,
					usf_id: 3,
					profissional_id: 1
				}
			});
			expect(mockEvent.locals.auth).toHaveBeenCalledOnce();
		});

		it('should extract user data correctly with all fields', async () => {
			const mockSession = {
				user: {
					email: 'doctor@hospital.com',
					name: 'Dr. Smith',
					image: 'https://example.com/avatar.jpg',
					profissional_id: 123,
					avaliador_id: 456,
					usf_id: 789,
					nome_profissional: 'Dr. John Smith'
				},
				expires: '2025-01-01'
			};

			const mockEvent = {
				locals: {
					auth: vi.fn().mockResolvedValue(mockSession)
				}
			} as any;

			const result = (await load(mockEvent)) as any;

			expect(result.user.profissional_id).toBe(123);
			expect(result.user.avaliador_id).toBe(456);
			expect(result.user.usf_id).toBe(789);
			expect(result.user.nome_profissional).toBe('Dr. John Smith');
			expect(result.user.email).toBe('doctor@hospital.com');
			expect(result.user.name).toBe('Dr. Smith');
		});
	});
});
