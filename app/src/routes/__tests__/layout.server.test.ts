import { describe, it, expect, vi } from 'vitest';
import { load } from '../+layout.server';

describe('+layout.server.ts', () => {
	describe('load function', () => {
		it('should return session when user is authenticated', async () => {
			// Mock authenticated session
			const mockSession = {
				user: {
					email: 'test@example.com',
					name: 'Test User',
					image: 'https://example.com/avatar.jpg',
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

			expect(result).toEqual({ session: mockSession });
			expect(mockEvent.locals.auth).toHaveBeenCalledOnce();
		});

		it('should return null session when user is not authenticated', async () => {
			const mockEvent = {
				locals: {
					auth: vi.fn().mockResolvedValue(null)
				}
			} as any;

			const result = await load(mockEvent);

			expect(result).toEqual({ session: null });
			expect(mockEvent.locals.auth).toHaveBeenCalledOnce();
		});

		it('should handle missing session gracefully', async () => {
			const mockEvent = {
				locals: {
					auth: vi.fn().mockResolvedValue(undefined)
				}
			} as any;

			const result = await load(mockEvent);

			expect(result).toEqual({ session: undefined });
			expect(mockEvent.locals.auth).toHaveBeenCalledOnce();
		});

		it('should return session with correct structure', async () => {
			const mockSession = {
				user: {
					email: 'doctor@hospital.com',
					name: 'Dr. Smith',
					image: 'https://example.com/smith.jpg',
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

			expect(result.session).toBeDefined();
			expect(result.session?.user).toBeDefined();
			expect(result.session?.user.email).toBe('doctor@hospital.com');
			expect(result.session?.user.nome_profissional).toBe('Dr. John Smith');
		});
	});
});
