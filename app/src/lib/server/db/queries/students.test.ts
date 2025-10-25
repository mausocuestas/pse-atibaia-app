import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getStudentById, getStudentEnrollment } from './students';
import type { Cliente } from '$lib/server/db/types';
import type { StudentEnrollmentInfo } from './students';

// Mock the sql function
vi.mock('$lib/server/db', () => ({
	sql: vi.fn()
}));

import { sql } from '$lib/server/db';

describe('students queries', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('getStudentById', () => {
		it('should return student data for valid alunoId', async () => {
			const mockStudent: Cliente = {
				id: 1,
				cliente: 'João Silva',
				data_nasc: new Date('2015-03-15'),
				sexo: 'M',
				cpf: '12345678901',
				cns: '123456789012345',
				ativo: true,
				created_at: new Date(),
				updated_at: new Date(),
				fone: null,
				cep: null,
				logradouro: null,
				numero: null,
				complemento: null,
				bairro: null,
				municipio: null,
				uf: null,
				nome_responsavel: null,
				fone_responsavel: null,
				observacoes: null,
				ra: null
			};

			vi.mocked(sql).mockResolvedValue([mockStudent] as any);

			const result = await getStudentById(1);

			expect(result).toEqual(mockStudent);
			expect(sql).toHaveBeenCalledTimes(1);
		});

		it('should return null for non-existent student', async () => {
			vi.mocked(sql).mockResolvedValue([] as any);

			const result = await getStudentById(999);

			expect(result).toBeNull();
		});

		it('should return null for invalid alunoId (negative)', async () => {
			const result = await getStudentById(-1);

			expect(result).toBeNull();
			expect(sql).not.toHaveBeenCalled();
		});

		it('should return null for invalid alunoId (zero)', async () => {
			const result = await getStudentById(0);

			expect(result).toBeNull();
			expect(sql).not.toHaveBeenCalled();
		});

		it('should handle database errors gracefully', async () => {
			vi.mocked(sql).mockRejectedValue(new Error('Database connection failed'));

			const result = await getStudentById(1);

			expect(result).toBeNull();
		});
	});

	describe('getStudentEnrollment', () => {
		it('should return enrollment info for valid inputs', async () => {
			const mockEnrollment: StudentEnrollmentInfo = {
				matricula_id: 1,
				aluno_id: 1,
				escola_id: 23001234,
				escola_nome: 'Escola Municipal Test',
				ano_letivo: 2025,
				turma: '1A',
				periodo: 'MANHÃ'
			};

			vi.mocked(sql).mockResolvedValue([mockEnrollment] as any);

			const result = await getStudentEnrollment(1, 2025);

			expect(result).toEqual(mockEnrollment);
			expect(sql).toHaveBeenCalledTimes(1);
		});

		it('should return null for non-existent enrollment', async () => {
			vi.mocked(sql).mockResolvedValue([] as any);

			const result = await getStudentEnrollment(999, 2025);

			expect(result).toBeNull();
		});

		it('should return null for invalid alunoId', async () => {
			const result = await getStudentEnrollment(-1, 2025);

			expect(result).toBeNull();
			expect(sql).not.toHaveBeenCalled();
		});

		it('should return null for invalid anoLetivo (too low)', async () => {
			const result = await getStudentEnrollment(1, 1999);

			expect(result).toBeNull();
			expect(sql).not.toHaveBeenCalled();
		});

		it('should return null for invalid anoLetivo (too high)', async () => {
			const result = await getStudentEnrollment(1, 2101);

			expect(result).toBeNull();
			expect(sql).not.toHaveBeenCalled();
		});

		it('should handle database errors gracefully', async () => {
			vi.mocked(sql).mockRejectedValue(new Error('Database connection failed'));

			const result = await getStudentEnrollment(1, 2025);

			expect(result).toBeNull();
		});

		it('should return escola_nome from JOIN with escolas table', async () => {
			const mockEnrollment: StudentEnrollmentInfo = {
				matricula_id: 1,
				aluno_id: 1,
				escola_id: 23001234,
				escola_nome: 'Escola Teste com Nome Longo',
				ano_letivo: 2025,
				turma: 'Pré I',
				periodo: 'INTEGRAL'
			};

			vi.mocked(sql).mockResolvedValue([mockEnrollment] as any);

			const result = await getStudentEnrollment(1, 2025);

			expect(result?.escola_nome).toBe('Escola Teste com Nome Longo');
		});
	});
});
