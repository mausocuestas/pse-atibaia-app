import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './+server';
import { enrollStudentWithInfo } from '$lib/server/db/queries/enrollment';

// Mock the enrollment function
vi.mock('$lib/server/db/queries/enrollment', () => ({
	enrollStudentWithInfo: vi.fn()
}));

describe('/api/students/enroll', () => {
	let mockLocals: any;

	beforeEach(() => {
		vi.clearAllMocks();
		mockLocals = {
			auth: vi.fn()
		};
	});

	describe('POST /api/students/enroll', () => {
		it('should return 401 when user is not authenticated', async () => {
			mockLocals.auth.mockResolvedValue(null);

			const request = new Request('http://localhost/api/students/enroll', {
				method: 'POST',
				body: JSON.stringify({}),
				headers: { 'Content-Type': 'application/json' }
			});

			const response = await POST({ request, locals: mockLocals });
			expect(response.status).toBe(401);
		});

		it('should return 403 when user is not evaluator or manager', async () => {
			mockLocals.auth.mockResolvedValue({
				user: { is_avaliador: false, is_gestor: false }
			});

			const request = new Request('http://localhost/api/students/enroll', {
				method: 'POST',
				body: JSON.stringify({}),
				headers: { 'Content-Type': 'application/json' }
			});

			const response = await POST({ request, locals: mockLocals });
			expect(response.status).toBe(403);
		});

		it('should return 400 when studentId is missing', async () => {
			mockLocals.auth.mockResolvedValue({
				user: { is_avaliador: true }
			});

			const request = new Request('http://localhost/api/students/enroll', {
				method: 'POST',
				body: JSON.stringify({
					escolaId: 12345,
					turma: '1A',
					periodo: 'MANHA',
					anoLetivo: 2025
				}),
				headers: { 'Content-Type': 'application/json' }
			});

			const response = await POST({ request, locals: mockLocals });
			expect(response.status).toBe(400);
		});

		it('should return 400 when periodo is invalid', async () => {
			mockLocals.auth.mockResolvedValue({
				user: { is_avaliador: true }
			});

			const request = new Request('http://localhost/api/students/enroll', {
				method: 'POST',
				body: JSON.stringify({
					studentId: 1,
					escolaId: 12345,
					turma: '1A',
					periodo: 'INVALIDO',
					anoLetivo: 2025
				}),
				headers: { 'Content-Type': 'application/json' }
			});

			const response = await POST({ request, locals: mockLocals });
			expect(response.status).toBe(400);
		});

		it('should enroll student successfully', async () => {
			const mockEnrollment = {
				enrollment: {
					id: 1,
					aluno_id: 1,
					escola_id: 12345,
					turma: '1A',
					periodo: 'MANHA',
					ano_letivo: 2025
				},
				student: {
					id: 1,
					nomeCompleto: 'João Silva',
					dataNascimento: '2010-05-15'
				}
			};

			mockLocals.auth.mockResolvedValue({
				user: { is_avaliador: true }
			});

			(enrollStudentWithInfo as any).mockResolvedValue(mockEnrollment);

			const request = new Request('http://localhost/api/students/enroll', {
				method: 'POST',
				body: JSON.stringify({
					studentId: 1,
					escolaId: 12345,
					turma: '1A',
					periodo: 'MANHA',
					anoLetivo: 2025
				}),
				headers: { 'Content-Type': 'application/json' }
			});

			const response = await POST({ request, locals: mockLocals });
			expect(response.status).toBe(200);

			const data = await response.json();
			expect(data.success).toBe(true);
			expect(data.message).toBe('Aluno matriculado com sucesso');
			expect(data.student).toEqual(mockEnrollment.student);
		});

		it('should handle duplicate enrollment gracefully', async () => {
			mockLocals.auth.mockResolvedValue({
				user: { is_avaliador: true }
			});

			(enrollStudentWithInfo as any).mockRejectedValue(
				new Error('Aluno já matriculado nesta turma')
			);

			const request = new Request('http://localhost/api/students/enroll', {
				method: 'POST',
				body: JSON.stringify({
					studentId: 1,
					escolaId: 12345,
					turma: '1A',
					periodo: 'MANHA',
					anoLetivo: 2025
				}),
				headers: { 'Content-Type': 'application/json' }
			});

			const response = await POST({ request, locals: mockLocals });
			expect(response.status).toBe(409);

			const data = await response.json();
			expect(data.message).toBe('Aluno já matriculado nesta turma');
		});

		it('should handle student not found', async () => {
			mockLocals.auth.mockResolvedValue({
				user: { is_avaliador: true }
			});

			(enrollStudentWithInfo as any).mockRejectedValue(
				new Error('Aluno não encontrado')
			);

			const request = new Request('http://localhost/api/students/enroll', {
				method: 'POST',
				body: JSON.stringify({
					studentId: 999,
					escolaId: 12345,
					turma: '1A',
					periodo: 'MANHA',
					anoLetivo: 2025
				}),
				headers: { 'Content-Type': 'application/json' }
			});

			const response = await POST({ request, locals: mockLocals });
			expect(response.status).toBe(404);

			const data = await response.json();
			expect(data.message).toBe('Aluno não encontrado');
		});

		it('should validate anoLetivo range', async () => {
			mockLocals.auth.mockResolvedValue({
				user: { is_avaliador: true }
			});

			const request = new Request('http://localhost/api/students/enroll', {
				method: 'POST',
				body: JSON.stringify({
					studentId: 1,
					escolaId: 12345,
					turma: '1A',
					periodo: 'MANHA',
					anoLetivo: 1900 // Too old
				}),
				headers: { 'Content-Type': 'application/json' }
			});

			const response = await POST({ request, locals: mockLocals });
			expect(response.status).toBe(400);
		});
	});

	describe('GET /api/students/enroll', () => {
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
			expect(data.message).toBe('Student enrollment API endpoint is working');
			expect(data.usage).toContain('POST with JSON body');
		});
	});
});