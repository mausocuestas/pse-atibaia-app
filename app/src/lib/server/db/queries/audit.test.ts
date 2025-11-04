import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sql } from '$lib/server/db';
import {
	logEnrollmentChange,
	getAuditLogsForStudent,
	getAuditLogsForEnrollment,
	updateEnrollmentWithAudit
} from './audit';

// Mock the database client
vi.mock('$lib/server/db', () => ({
	sql: vi.fn()
}));

describe('audit.ts - Enrollment Audit Functions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('logEnrollmentChange', () => {
		it('should create audit log successfully', async () => {
			const mockResult = [{ id: 1 }];
			(sql as any).mockResolvedValue(mockResult);

			const oldValues = { escola_id: 12345, turma: '1A', periodo: 'Manhã', ano_letivo: 2024 };
			const newValues = { escola_id: 54321, turma: '2B', periodo: 'Tarde', ano_letivo: 2025 };

			const auditLogId = await logEnrollmentChange(1, oldValues, newValues, 100);

			expect(auditLogId).toBe(1);
			expect(sql).toHaveBeenCalledOnce();
		});

		it('should throw error when audit log creation fails', async () => {
			(sql as any).mockResolvedValue([]);

			const oldValues = { escola_id: 12345, turma: '1A', periodo: 'Manhã', ano_letivo: 2024 };
			const newValues = { escola_id: 54321, turma: '2B', periodo: 'Tarde', ano_letivo: 2025 };

			await expect(logEnrollmentChange(1, oldValues, newValues, 100)).rejects.toThrow(
				'Erro ao registrar log de auditoria'
			);
		});

		it('should include IP address and user agent in audit log', async () => {
			const mockResult = [{ id: 1 }];
			(sql as any).mockResolvedValue(mockResult);

			const oldValues = { escola_id: 12345, turma: '1A', periodo: 'Manhã', ano_letivo: 2024 };
			const newValues = { escola_id: 54321, turma: '2B', periodo: 'Tarde', ano_letivo: 2025 };

			await logEnrollmentChange(
				1,
				oldValues,
				newValues,
				100,
				'192.168.1.1',
				'Mozilla/5.0 Test Browser'
			);

			expect(sql).toHaveBeenCalledOnce();
		});
	});

	describe('getAuditLogsForStudent', () => {
		it('should retrieve audit logs for a student', async () => {
			const mockLogs = [
				{
					id: 1,
					table_name: 'pse.matriculas',
					record_id: 1,
					action_type: 'UPDATE',
					changed_by: 100,
					changed_at: new Date(),
					old_values: { escola_id: 12345 },
					new_values: { escola_id: 54321 },
					changed_by_name: 'Test User'
				}
			];
			(sql as any).mockResolvedValue(mockLogs);

			const logs = await getAuditLogsForStudent(1);

			expect(logs).toHaveLength(1);
			expect(logs[0].changed_by_name).toBe('Test User');
			expect(sql).toHaveBeenCalledOnce();
		});

		it('should respect limit parameter', async () => {
			(sql as any).mockResolvedValue([]);

			await getAuditLogsForStudent(1, 10);

			expect(sql).toHaveBeenCalledOnce();
		});

		it('should throw error when query fails', async () => {
			(sql as any).mockRejectedValue(new Error('Database error'));

			await expect(getAuditLogsForStudent(1)).rejects.toThrow(
				'Erro ao buscar logs de auditoria do aluno'
			);
		});
	});

	describe('getAuditLogsForEnrollment', () => {
		it('should retrieve audit logs for an enrollment', async () => {
			const mockLogs = [
				{
					id: 1,
					table_name: 'pse.matriculas',
					record_id: 1,
					action_type: 'UPDATE',
					changed_by: 100,
					changed_at: new Date(),
					old_values: { escola_id: 12345 },
					new_values: { escola_id: 54321 },
					changed_by_name: 'Test User'
				}
			];
			(sql as any).mockResolvedValue(mockLogs);

			const logs = await getAuditLogsForEnrollment(1);

			expect(logs).toHaveLength(1);
			expect(logs[0].record_id).toBe(1);
			expect(sql).toHaveBeenCalledOnce();
		});

		it('should throw error when query fails', async () => {
			(sql as any).mockRejectedValue(new Error('Database error'));

			await expect(getAuditLogsForEnrollment(1)).rejects.toThrow(
				'Erro ao buscar logs de auditoria da matrícula'
			);
		});
	});

	describe('updateEnrollmentWithAudit - Transaction Safety', () => {
		it('should complete enrollment update and audit logging in transaction', async () => {
			const mockTransaction = vi.fn(async (callback) => {
				const tx = vi.fn();
				// Mock old enrollment query
				tx.mockResolvedValueOnce([
					{
						id: 1,
						aluno_id: 100,
						escola_id: 12345,
						turma: '1A',
						periodo: 'Manhã',
						ano_letivo: 2024,
						observacoes: null
					}
				]);
				// Mock duplicate check
				tx.mockResolvedValueOnce([]);
				// Mock school check
				tx.mockResolvedValueOnce([{ inep: 54321, ativo: 'S' }]);
				// Mock update enrollment
				tx.mockResolvedValueOnce([
					{
						id: 1,
						aluno_id: 100,
						escola_id: 54321,
						turma: '2B',
						periodo: 'Tarde',
						ano_letivo: 2025,
						observacoes: 'Test'
					}
				]);
				// Mock audit log insert
				tx.mockResolvedValueOnce([{ id: 1 }]);

				return await callback(tx);
			});

			(sql as any).begin = mockTransaction;

			const result = await updateEnrollmentWithAudit(
				{
					enrollmentId: 1,
					escolaId: 54321,
					turma: '2B',
					periodo: 'Tarde',
					anoLetivo: 2025,
					observacoes: 'Test'
				},
				100
			);

			expect(result.enrollment.escola_id).toBe(54321);
			expect(result.auditLogId).toBe(1);
			expect(mockTransaction).toHaveBeenCalledOnce();
		});

		it('should rollback transaction when enrollment not found', async () => {
			const mockTransaction = vi.fn(async (callback) => {
				const tx = vi.fn();
				// Mock old enrollment query - enrollment not found
				tx.mockResolvedValueOnce([]);

				return await callback(tx);
			});

			(sql as any).begin = mockTransaction;

			await expect(
				updateEnrollmentWithAudit(
					{
						enrollmentId: 999,
						escolaId: 54321,
						turma: '2B',
						periodo: 'Tarde',
						anoLetivo: 2025
					},
					100
				)
			).rejects.toThrow('Matrícula não encontrada');
		});

		it('should rollback transaction when duplicate enrollment detected', async () => {
			const mockTransaction = vi.fn(async (callback) => {
				const tx = vi.fn();
				// Mock old enrollment query
				tx.mockResolvedValueOnce([
					{
						id: 1,
						aluno_id: 100,
						escola_id: 12345,
						turma: '1A',
						periodo: 'Manhã',
						ano_letivo: 2024,
						observacoes: null
					}
				]);
				// Mock duplicate check - duplicate found
				tx.mockResolvedValueOnce([{ id: 2 }]);

				return await callback(tx);
			});

			(sql as any).begin = mockTransaction;

			await expect(
				updateEnrollmentWithAudit(
					{
						enrollmentId: 1,
						escolaId: 54321,
						turma: '2B',
						periodo: 'Tarde',
						anoLetivo: 2025
					},
					100
				)
			).rejects.toThrow('Aluno já matriculado nesta turma, escola e período');
		});

		it('should rollback transaction when school not found', async () => {
			const mockTransaction = vi.fn(async (callback) => {
				const tx = vi.fn();
				// Mock old enrollment query
				tx.mockResolvedValueOnce([
					{
						id: 1,
						aluno_id: 100,
						escola_id: 12345,
						turma: '1A',
						periodo: 'Manhã',
						ano_letivo: 2024,
						observacoes: null
					}
				]);
				// Mock duplicate check
				tx.mockResolvedValueOnce([]);
				// Mock school check - school not found
				tx.mockResolvedValueOnce([]);

				return await callback(tx);
			});

			(sql as any).begin = mockTransaction;

			await expect(
				updateEnrollmentWithAudit(
					{
						enrollmentId: 1,
						escolaId: 99999,
						turma: '2B',
						periodo: 'Tarde',
						anoLetivo: 2025
					},
					100
				)
			).rejects.toThrow('Escola não encontrada');
		});

		it('should rollback transaction when school is inactive', async () => {
			const mockTransaction = vi.fn(async (callback) => {
				const tx = vi.fn();
				// Mock old enrollment query
				tx.mockResolvedValueOnce([
					{
						id: 1,
						aluno_id: 100,
						escola_id: 12345,
						turma: '1A',
						periodo: 'Manhã',
						ano_letivo: 2024,
						observacoes: null
					}
				]);
				// Mock duplicate check
				tx.mockResolvedValueOnce([]);
				// Mock school check - school inactive
				tx.mockResolvedValueOnce([{ inep: 54321, ativo: 'N' }]);

				return await callback(tx);
			});

			(sql as any).begin = mockTransaction;

			await expect(
				updateEnrollmentWithAudit(
					{
						enrollmentId: 1,
						escolaId: 54321,
						turma: '2B',
						periodo: 'Tarde',
						anoLetivo: 2025
					},
					100
				)
			).rejects.toThrow('Escola não está ativa');
		});

		it('should rollback transaction when audit log creation fails', async () => {
			const mockTransaction = vi.fn(async (callback) => {
				const tx = vi.fn();
				// Mock old enrollment query
				tx.mockResolvedValueOnce([
					{
						id: 1,
						aluno_id: 100,
						escola_id: 12345,
						turma: '1A',
						periodo: 'Manhã',
						ano_letivo: 2024,
						observacoes: null
					}
				]);
				// Mock duplicate check
				tx.mockResolvedValueOnce([]);
				// Mock school check
				tx.mockResolvedValueOnce([{ inep: 54321, ativo: 'S' }]);
				// Mock update enrollment
				tx.mockResolvedValueOnce([
					{
						id: 1,
						aluno_id: 100,
						escola_id: 54321,
						turma: '2B',
						periodo: 'Tarde',
						ano_letivo: 2025,
						observacoes: null
					}
				]);
				// Mock audit log insert - FAILS
				tx.mockResolvedValueOnce([]);

				return await callback(tx);
			});

			(sql as any).begin = mockTransaction;

			await expect(
				updateEnrollmentWithAudit(
					{
						enrollmentId: 1,
						escolaId: 54321,
						turma: '2B',
						periodo: 'Tarde',
						anoLetivo: 2025
					},
					100
				)
			).rejects.toThrow('Erro ao criar log de auditoria');
		});

		it('should include observacoes in audit log values', async () => {
			const mockTransaction = vi.fn(async (callback) => {
				const tx = vi.fn();
				// Mock old enrollment query with observacoes
				tx.mockResolvedValueOnce([
					{
						id: 1,
						aluno_id: 100,
						escola_id: 12345,
						turma: '1A',
						periodo: 'Manhã',
						ano_letivo: 2024,
						observacoes: 'Old observation'
					}
				]);
				// Mock duplicate check
				tx.mockResolvedValueOnce([]);
				// Mock school check
				tx.mockResolvedValueOnce([{ inep: 54321, ativo: 'S' }]);
				// Mock update enrollment
				tx.mockResolvedValueOnce([
					{
						id: 1,
						aluno_id: 100,
						escola_id: 54321,
						turma: '2B',
						periodo: 'Tarde',
						ano_letivo: 2025,
						observacoes: 'New observation'
					}
				]);
				// Mock audit log insert - capture the call to verify observacoes
				tx.mockImplementationOnce(async (strings, ...values) => {
					const jsonIndex = values.findIndex((v) => typeof v === 'string' && v.includes('Old'));
					expect(jsonIndex).toBeGreaterThan(-1);
					const oldValues = JSON.parse(values[jsonIndex]);
					expect(oldValues.observacoes).toBe('Old observation');

					const newJsonIndex = values.findIndex((v) => typeof v === 'string' && v.includes('New'));
					expect(newJsonIndex).toBeGreaterThan(-1);
					const newValues = JSON.parse(values[newJsonIndex]);
					expect(newValues.observacoes).toBe('New observation');

					return [{ id: 1 }];
				});

				return await callback(tx);
			});

			(sql as any).begin = mockTransaction;

			const result = await updateEnrollmentWithAudit(
				{
					enrollmentId: 1,
					escolaId: 54321,
					turma: '2B',
					periodo: 'Tarde',
					anoLetivo: 2025,
					observacoes: 'New observation'
				},
				100
			);

			expect(result.enrollment.observacoes).toBe('New observation');
		});
	});
});
