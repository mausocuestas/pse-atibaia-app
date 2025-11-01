// @ts-nocheck - Test file with mocked modules
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load } from '../+page.server';
import { error } from '@sveltejs/kit';

// Helper function to extract error details
function getErrorDetails(err: any) {
	// Handle HttpError from SvelteKit
	if (err && typeof err === 'object') {
		if ('status' in err && 'body' in err) {
			return {
				status: err.status,
				body: err.body
			};
		}
		// Handle errors that have status but no body
		if ('status' in err) {
			return {
				status: err.status,
				body: { message: err.message || 'Error' }
			};
		}
	}
	return {
		status: 500,
		body: { message: err?.message || 'Unknown error' }
	};
}

// Mock the database queries
vi.mock('$lib/server/db/queries/student-history', () => ({
	getStudentCompleteHistory: vi.fn()
}));

describe('Student Detail Page Server Load', () => {
	let mockParams: any;
	let mockLocals: any;
	let mockGetStudentCompleteHistory: any;

	beforeEach(async () => {
		vi.clearAllMocks();

		mockParams = {
			id: '123'
		};

		mockLocals = {
			auth: vi.fn()
		};

		const { getStudentCompleteHistory } = await import('$lib/server/db/queries/student-history');
		mockGetStudentCompleteHistory = getStudentCompleteHistory;

		// Setup default auth mock for successful manager access
		mockLocals.auth.mockResolvedValue({
			user: { id: 1, email: 'manager@test.com', is_gestor: true }
		});

		// Setup default database mock (will be overridden in specific tests)
		// Note: Each test should set up its own mock expectations
		mockGetStudentCompleteHistory.mockResolvedValue({
			studentInfo: { id: 123, nome_completo: 'Test Student' },
			anthropometricHistory: [],
			visualHistory: [],
			dentalHistory: []
		});
	});

	describe('Authentication & Authorization', () => {
		it('should return 401 when user is not authenticated', async () => {
			mockLocals.auth.mockResolvedValue(null);

			try {
				await load({ params: mockParams, locals: mockLocals } as any);
				expect.fail('Expected error to be thrown');
			} catch (err: any) {
				expect(err.status).toBe(401);
				expect(err.body).toEqual({ message: 'Não autorizado' });
			}
		});

		it('should return 403 when user is not a manager', async () => {
			mockLocals.auth.mockResolvedValue({
				user: { id: 1, email: 'user@test.com', is_gestor: false }
			});

			try {
				await load({ params: mockParams, locals: mockLocals } as any);
				expect.fail('Expected error to be thrown');
			} catch (err: any) {
				expect(err.status).toBe(403);
				expect(err.body).toEqual({ message: 'Acesso negado. Apenas gestores podem acessar esta página.' });
			}
		});

		it('should allow access for authenticated managers', async () => {
			mockLocals.auth.mockResolvedValueOnce({
				user: { id: 1, email: 'manager@test.com', is_gestor: true }
			});

			mockGetStudentCompleteHistory.mockResolvedValueOnce({
				studentInfo: {
					id: 123,
					nome_completo: 'Test Student',
					data_nascimento: new Date('2010-05-15'),
					sexo: 'Masculino',
					escola_id: 456,
					escola_nome: 'Test School',
					ano_letivo: 2025,
					turma: '4º Ano',
					periodo: 'Manhã'
				},
				anthropometricHistory: [],
				visualHistory: [],
				dentalHistory: []
			});

			const result = await load({ params: mockParams, locals: mockLocals } as any);

			expect(result).toEqual({
				studentData: {
					studentInfo: expect.objectContaining({
						id: 123,
						nome_completo: 'Test Student'
					}),
					anthropometricHistory: [],
					visualHistory: [],
					dentalHistory: []
				}
			});
		});
	});

	describe('Parameter Validation', () => {

		it('should return 400 for invalid student ID (non-numeric)', async () => {
			mockParams.id = 'invalid';
			// Mock should not be called since validation should fail before database query
			// But we need to provide a safe implementation in case it is called
			mockGetStudentCompleteHistory.mockImplementation(() => {
				throw new Error('Database should not be reached for invalid ID');
			});

			try {
				await load({ params: mockParams, locals: mockLocals } as any);
				expect.fail('Expected error to be thrown');
			} catch (err: any) {
				expect(err.status).toBe(400);
				expect(err.body).toEqual({ message: 'ID de aluno inválido' });
			}

			// Verify database was not called due to validation failure
			expect(mockGetStudentCompleteHistory).not.toHaveBeenCalled();
		});

		it('should return 400 for negative student ID', async () => {
			mockParams.id = '-1';
			// Mock should not be called since validation should fail before database query
			mockGetStudentCompleteHistory.mockImplementation(() => {
				throw new Error('Database should not be reached for invalid ID');
			});

			try {
				await load({ params: mockParams, locals: mockLocals } as any);
				expect.fail('Expected error to be thrown');
			} catch (err: any) {
				expect(err.status).toBe(400);
				expect(err.body).toEqual({ message: 'ID de aluno inválido' });
			}

			// Verify database was not called due to validation failure
			expect(mockGetStudentCompleteHistory).not.toHaveBeenCalled();
		});

		it('should return 400 for zero student ID', async () => {
			mockParams.id = '0';
			// Mock should not be called since validation should fail before database query
			mockGetStudentCompleteHistory.mockImplementation(() => {
				throw new Error('Database should not be reached for invalid ID');
			});

			try {
				await load({ params: mockParams, locals: mockLocals } as any);
				expect.fail('Expected error to be thrown');
			} catch (err: any) {
				expect(err.status).toBe(400);
				expect(err.body).toEqual({ message: 'ID de aluno inválido' });
			}

			// Verify database was not called due to validation failure
			expect(mockGetStudentCompleteHistory).not.toHaveBeenCalled();
		});

		it('should accept valid numeric student IDs', async () => {
			mockGetStudentCompleteHistory.mockResolvedValueOnce({
				studentInfo: { id: 123 },
				anthropometricHistory: [],
				visualHistory: [],
				dentalHistory: []
			});

			const result = await load({ params: mockParams, locals: mockLocals } as any);

			expect(result).toBeDefined();
			expect(result.studentData).toBeDefined();
			expect(mockGetStudentCompleteHistory).toHaveBeenCalledWith(123);
		});
	});

	describe('Data Fetching', () => {

		it('should return 404 when student is not found', async () => {
			mockGetStudentCompleteHistory.mockResolvedValueOnce({
				studentInfo: null,
				anthropometricHistory: [],
				visualHistory: [],
				dentalHistory: []
			});

			try {
				await load({ params: mockParams, locals: mockLocals } as any);
				expect.fail('Expected error to be thrown');
			} catch (err: any) {
				expect(err.status).toBe(404);
				expect(err.body).toEqual({ message: 'Aluno não encontrado' });
			}
		});

		it('should return complete student data with history', async () => {
			const mockStudentData = {
				studentInfo: {
					id: 123,
					nome_completo: 'João Silva',
					data_nascimento: new Date('2010-05-15'),
					sexo: 'Masculino',
					escola_id: 456,
					escola_nome: 'Escola Teste',
					ano_letivo: 2025,
					turma: '4º Ano A',
					periodo: 'Manhã'
				},
				anthropometricHistory: [
					{
						id: 1,
						data_avaliacao: new Date('2023-04-15'),
						peso_kg: 25.5,
						altura_cm: 120.0,
						imc: 17.7,
						classificacao_cdc: 'Peso adequado',
						ano_referencia: 2023
					},
					{
						id: 2,
						data_avaliacao: new Date('2024-04-20'),
						peso_kg: 28.0,
						altura_cm: 125.0,
						imc: 17.9,
						classificacao_cdc: 'Peso adequado',
						ano_referencia: 2024
					}
				],
				visualHistory: [
					{
						id: 1,
						data_avaliacao: new Date('2024-04-15'),
						olho_direito: 1.0,
						olho_esquerdo: 0.9,
						reteste: null,
						ano_referencia: 2024
					}
				],
				dentalHistory: [
					{
						id: 1,
						data_avaliacao: new Date('2024-04-15'),
						risco: 'C',
						atf_realizado: true,
						necessita_art: false,
						art_quantidade_dentes: null,
						escovacao_orientada_realizada: true,
						ano_referencia: 2024
					}
				]
			};

			mockGetStudentCompleteHistory.mockResolvedValueOnce(mockStudentData);

			const result = await load({ params: mockParams, locals: mockLocals } as any);

			expect(result).toEqual({ studentData: mockStudentData });
			expect(mockGetStudentCompleteHistory).toHaveBeenCalledWith(123);
		});

		it('should handle empty history arrays gracefully', async () => {
			mockGetStudentCompleteHistory.mockResolvedValueOnce({
				studentInfo: {
					id: 123,
					nome_completo: 'Student With No History',
					data_nascimento: new Date('2010-05-15'),
					sexo: 'Masculino',
					escola_id: 456,
					escola_nome: 'Test School',
					ano_letivo: 2025
				},
				anthropometricHistory: [],
				visualHistory: [],
				dentalHistory: []
			});

			const result = await load({ params: mockParams, locals: mockLocals } as any);

			expect(result.studentData.studentInfo).toBeDefined();
			expect(result.studentData.anthropometricHistory).toEqual([]);
			expect(result.studentData.visualHistory).toEqual([]);
			expect(result.studentData.dentalHistory).toEqual([]);
		});
	});

	describe('Error Handling', () => {

		it('should return 500 for database errors', async () => {
			mockGetStudentCompleteHistory.mockReset();
			mockGetStudentCompleteHistory.mockRejectedValue(new Error('Database connection failed'));

			await expect(load({ params: mockParams, locals: mockLocals } as any)).rejects.toThrow();
			await expect(load({ params: mockParams, locals: mockLocals } as any)).rejects.toMatchObject({
				status: 500,
				body: { message: 'Erro ao carregar dados do aluno' }
			});
		});

		it('should re-throw known errors (with status)', async () => {
			const knownError = Object.assign(new Error('Not found'), { status: 404 });
			mockGetStudentCompleteHistory.mockReset();
			mockGetStudentCompleteHistory.mockRejectedValue(knownError);

			await expect(load({ params: mockParams, locals: mockLocals } as any)).rejects.toThrow(knownError);
		});

		it('should handle unexpected errors gracefully', async () => {
			mockGetStudentCompleteHistory.mockReset();
			mockGetStudentCompleteHistory.mockRejectedValue(new Error('Unexpected error'));

			await expect(load({ params: mockParams, locals: mockLocals } as any)).rejects.toThrow();
			await expect(load({ params: mockParams, locals: mockLocals } as any)).rejects.toMatchObject({
				status: 500,
				body: { message: 'Erro ao carregar dados do aluno' }
			});
		});
	});

	describe('Edge Cases', () => {

		it('should handle very large student IDs', async () => {
			mockParams.id = '999999999';

			mockGetStudentCompleteHistory.mockResolvedValueOnce({
				studentInfo: { id: 999999999, nome_completo: 'Large ID Student' },
				anthropometricHistory: [],
				visualHistory: [],
				dentalHistory: []
			});

			const result = await load({ params: mockParams, locals: mockLocals } as any);

			expect(result.studentData.studentInfo.id).toBe(999999999);
			expect(mockGetStudentCompleteHistory).toHaveBeenCalledWith(999999999);
		});

		it('should handle students with mixed data availability', async () => {
			mockGetStudentCompleteHistory.mockResolvedValueOnce({
				studentInfo: {
					id: 123,
					nome_completo: 'Partial Data Student',
					data_nascimento: new Date('2010-05-15'),
					sexo: 'Feminino',
					escola_id: 456,
					escola_nome: 'Test School',
					ano_letivo: 2025
				},
				anthropometricHistory: [
					{
						id: 1,
						data_avaliacao: new Date('2024-04-15'),
						peso_kg: 28.0,
						altura_cm: 125.0,
						imc: 17.9,
						classificacao_cdc: 'Peso adequado',
						ano_referencia: 2024
					}
				],
				visualHistory: [], // No visual data
				dentalHistory: [
					{
						id: 1,
						data_avaliacao: new Date('2024-04-15'),
						risco: 'B',
						atf_realizado: true,
						necessita_art: false,
						art_quantidade_dentes: null,
						escovacao_orientada_realizada: true,
						ano_referencia: 2024
					}
				]
			});

			const result = await load({ params: mockParams, locals: mockLocals } as any);

			expect(result.studentData.anthropometricHistory).toHaveLength(1);
			expect(result.studentData.visualHistory).toHaveLength(0);
			expect(result.studentData.dentalHistory).toHaveLength(1);
		});
	});
});