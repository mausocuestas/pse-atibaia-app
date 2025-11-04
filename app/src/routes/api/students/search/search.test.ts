import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './+server';
import { searchStudentsWithEnrollments } from '$lib/server/db/queries/student-search';

// Mock the search function
vi.mock('$lib/server/db/queries/student-search', () => ({
	searchStudentsWithEnrollments: vi.fn()
}));

describe('/api/students/search', () => {
	let mockLocals: any;

	beforeEach(() => {
		vi.clearAllMocks();
		mockLocals = {
			auth: vi.fn()
		};
	});

	describe('POST /api/students/search', () => {
		it('should return 401 when user is not authenticated', async () => {
			mockLocals.auth.mockResolvedValue(null);

			const request = new Request('http://localhost/api/students/search', {
				method: 'POST',
				body: JSON.stringify({ nome: 'Test' }),
				headers: { 'Content-Type': 'application/json' }
			});

			const response = await POST({ request, locals: mockLocals });
			expect(response.status).toBe(401);
		});

		it('should return 403 when user is not evaluator or manager', async () => {
			mockLocals.auth.mockResolvedValue({
				user: { is_avaliador: false, is_gestor: false }
			});

			const request = new Request('http://localhost/api/students/search', {
				method: 'POST',
				body: JSON.stringify({ nome: 'Test' }),
				headers: { 'Content-Type': 'application/json' }
			});

			const response = await POST({ request, locals: mockLocals });
			expect(response.status).toBe(403);
		});

		it('should return 400 when no search criteria provided', async () => {
			mockLocals.auth.mockResolvedValue({
				user: { is_avaliador: true }
			});

			const request = new Request('http://localhost/api/students/search', {
				method: 'POST',
				body: JSON.stringify({}),
				headers: { 'Content-Type': 'application/json' }
			});

			const response = await POST({ request, locals: mockLocals });
			expect(response.status).toBe(400);
		});

		it('should search students successfully', async () => {
			const mockResults = [
				{
					id: 1,
					nomeCompleto: 'João Silva',
					dataNascimento: '2010-05-15',
					cpf: '12345678901'
				}
			];

			mockLocals.auth.mockResolvedValue({
				user: { is_avaliador: true }
			});

			(searchStudentsWithEnrollments as any).mockResolvedValue(mockResults);

			const request = new Request('http://localhost/api/students/search', {
				method: 'POST',
				body: JSON.stringify({ nome: 'João' }),
				headers: { 'Content-Type': 'application/json' }
			});

			const response = await POST({ request, locals: mockLocals });
			expect(response.status).toBe(200);

			const data = await response.json();
			expect(data).toEqual(mockResults);
		});

		it('should search with valid CPF', async () => {
			const mockResults = [
				{
					id: 1,
					nomeCompleto: 'João Silva',
					dataNascimento: '2010-05-15',
					cpf: '12345678901'
				}
			];

			mockLocals.auth.mockResolvedValue({
				user: { is_avaliador: true }
			});

			(searchStudentsWithEnrollments as any).mockResolvedValue(mockResults);

			const request = new Request('http://localhost/api/students/search', {
				method: 'POST',
				body: JSON.stringify({ cpf: '123.456.789-01' }),
				headers: { 'Content-Type': 'application/json' }
			});

			const response = await POST({ request, locals: mockLocals });
			expect(response.status).toBe(200);

			const data = await response.json();
			expect(data).toEqual(mockResults);
		});
	});

	describe('GET /api/students/search', () => {
		it('should return 401 when user is not authenticated', async () => {
			mockLocals.auth.mockResolvedValue(null);

			const response = await GET({ locals: mockLocals });
			expect(response.status).toBe(401);
		});

		it('should return API info when authenticated', async () => {
			mockLocals.auth.mockResolvedValue({
				user: { is_avaliador: true }
			});

			const response = await GET({ locals: mockLocals });
			expect(response.status).toBe(200);

			const data = await response.json();
			expect(data.message).toBe('Student search API endpoint is working');
		});
	});
});