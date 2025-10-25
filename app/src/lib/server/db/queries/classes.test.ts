import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPeriodsBySchool, getClassesBySchoolAndPeriod, getStudentsByClass } from './classes';
import type { PeriodData, ClassData, StudentData } from './classes';

// Mock the database connection
vi.mock('$lib/server/db', () => ({
	sql: vi.fn()
}));

describe('getPeriodsBySchool', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should return distinct periods for a school', async () => {
		const { sql } = await import('$lib/server/db');
		const mockResult: PeriodData[] = [
			{ periodo: 'INTEGRAL', total_alunos: 50, alunos_avaliados: 10 },
			{ periodo: 'MANHA', total_alunos: 75, alunos_avaliados: 25 },
			{ periodo: 'TARDE', total_alunos: 60, alunos_avaliados: 15 }
		];

		(sql as any).mockResolvedValue(mockResult);

		const result = await getPeriodsBySchool(12345678, 2025);

		expect(result).toEqual(mockResult);
		expect(result).toHaveLength(3);
		expect(sql).toHaveBeenCalled();
		const callArgs = (sql as any).mock.calls[0];
		expect(callArgs[0].join('')).toContain('pse.matriculas');
		expect(callArgs[0].join('')).toContain('COUNT(DISTINCT');
	});

	it('should return empty array when school has no periods', async () => {
		const { sql } = await import('$lib/server/db');
		(sql as any).mockResolvedValue([]);

		const result = await getPeriodsBySchool(99999999, 2025);

		expect(result).toEqual([]);
		expect(result).toHaveLength(0);
	});

	it('should return empty array when escola_id is invalid', async () => {
		const { sql } = await import('$lib/server/db');
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		const result = await getPeriodsBySchool(-1, 2025);

		expect(result).toEqual([]);
		expect(sql).not.toHaveBeenCalled();
		expect(consoleErrorSpy).toHaveBeenCalled();

		consoleErrorSpy.mockRestore();
	});

	it('should return empty array when ano_letivo is invalid', async () => {
		const { sql } = await import('$lib/server/db');
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		const result = await getPeriodsBySchool(12345678, 1999);

		expect(result).toEqual([]);
		expect(sql).not.toHaveBeenCalled();
		expect(consoleErrorSpy).toHaveBeenCalled();

		consoleErrorSpy.mockRestore();
	});

	it('should handle database errors gracefully', async () => {
		const { sql } = await import('$lib/server/db');
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		(sql as any).mockRejectedValue(new Error('Database error'));

		const result = await getPeriodsBySchool(12345678, 2025);

		expect(result).toEqual([]);
		expect(consoleErrorSpy).toHaveBeenCalled();

		consoleErrorSpy.mockRestore();
	});
});

describe('getClassesBySchoolAndPeriod', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should return classes with student counts', async () => {
		const { sql } = await import('$lib/server/db');
		const mockResult: ClassData[] = [
			{ turma: '1A', total_alunos: 25, alunos_avaliados: 5 },
			{ turma: '1B', total_alunos: 28, alunos_avaliados: 10 },
			{ turma: '2A', total_alunos: 22, alunos_avaliados: 8 }
		];

		(sql as any).mockResolvedValue(mockResult);

		const result = await getClassesBySchoolAndPeriod(12345678, 'MANHA', 2025);

		expect(result).toEqual(mockResult);
		expect(result).toHaveLength(3);
		expect(result[0].total_alunos).toBe(25);
		expect(result[0].alunos_avaliados).toBe(5);
		expect(sql).toHaveBeenCalled();
		const callArgs = (sql as any).mock.calls[0];
		expect(callArgs[0].join('')).toContain('COUNT(DISTINCT');
		expect(callArgs[0].join('')).toContain('GROUP BY');
	});

	it('should return empty array when no classes found', async () => {
		const { sql } = await import('$lib/server/db');
		(sql as any).mockResolvedValue([]);

		const result = await getClassesBySchoolAndPeriod(12345678, 'NOITE', 2025);

		expect(result).toEqual([]);
		expect(result).toHaveLength(0);
	});

	it('should return empty array when periodo is invalid', async () => {
		const { sql } = await import('$lib/server/db');
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		const result = await getClassesBySchoolAndPeriod(12345678, 'INVALID', 2025);

		expect(result).toEqual([]);
		expect(sql).not.toHaveBeenCalled();
		expect(consoleErrorSpy).toHaveBeenCalled();

		consoleErrorSpy.mockRestore();
	});

	it('should return empty array when escola_id is invalid', async () => {
		const { sql } = await import('$lib/server/db');
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		const result = await getClassesBySchoolAndPeriod(0, 'MANHÃ', 2025);

		expect(result).toEqual([]);
		expect(sql).not.toHaveBeenCalled();
		expect(consoleErrorSpy).toHaveBeenCalled();

		consoleErrorSpy.mockRestore();
	});

	it('should handle database errors gracefully', async () => {
		const { sql } = await import('$lib/server/db');
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		(sql as any).mockRejectedValue(new Error('Database error'));

		const result = await getClassesBySchoolAndPeriod(12345678, 'MANHÃ', 2025);

		expect(result).toEqual([]);
		expect(consoleErrorSpy).toHaveBeenCalled();

		consoleErrorSpy.mockRestore();
	});
});

describe('getStudentsByClass', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should return students with evaluation status', async () => {
		const { sql } = await import('$lib/server/db');
		const mockResult: StudentData[] = [
			{
				aluno_id: 1,
				nome: 'Ana Silva',
				data_nasc: new Date('2015-03-15'),
				idade: 10,
				has_visual_eval: true,
				has_anthropometric_eval: true,
				has_dental_eval: false
			},
			{
				aluno_id: 2,
				nome: 'Bruno Santos',
				data_nasc: new Date('2015-07-22'),
				idade: 10,
				has_visual_eval: false,
				has_anthropometric_eval: false,
				has_dental_eval: false
			}
		];

		(sql as any).mockResolvedValue(mockResult);

		const result = await getStudentsByClass(12345678, 'MANHA', '1A', 2025);

		expect(result).toEqual(mockResult);
		expect(result).toHaveLength(2);
		expect(result[0].nome).toBe('Ana Silva');
		expect(result[0].has_visual_eval).toBe(true);
		expect(sql).toHaveBeenCalled();
		const callArgs = (sql as any).mock.calls[0];
		expect(callArgs[0].join('')).toContain('shared.clientes');
		expect(callArgs[0].join('')).toContain('pse.matriculas');
		expect(callArgs[0].join('')).toContain('avaliacoes_acuidade_visual');
		expect(callArgs[0].join('')).toContain('avaliacoes_antropometricas');
		expect(callArgs[0].join('')).toContain('avaliacoes_odontologicas');
	});

	it('should return empty array when no students found', async () => {
		const { sql } = await import('$lib/server/db');
		(sql as any).mockResolvedValue([]);

		const result = await getStudentsByClass(12345678, 'MANHÃ', 'EMPTY', 2025);

		expect(result).toEqual([]);
		expect(result).toHaveLength(0);
	});

	it('should return empty array when periodo is invalid', async () => {
		const { sql } = await import('$lib/server/db');
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		const result = await getStudentsByClass(12345678, 'INVALID', '1A', 2025);

		expect(result).toEqual([]);
		expect(sql).not.toHaveBeenCalled();
		expect(consoleErrorSpy).toHaveBeenCalled();

		consoleErrorSpy.mockRestore();
	});

	it('should return empty array when turma is empty', async () => {
		const { sql } = await import('$lib/server/db');
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		const result = await getStudentsByClass(12345678, 'MANHÃ', '', 2025);

		expect(result).toEqual([]);
		expect(sql).not.toHaveBeenCalled();
		expect(consoleErrorSpy).toHaveBeenCalled();

		consoleErrorSpy.mockRestore();
	});

	it('should handle students with null data_nasc', async () => {
		const { sql } = await import('$lib/server/db');
		const mockResult: StudentData[] = [
			{
				aluno_id: 1,
				nome: 'Carlos Oliveira',
				data_nasc: null,
				idade: null,
				has_visual_eval: false,
				has_anthropometric_eval: false,
				has_dental_eval: false
			}
		];

		(sql as any).mockResolvedValue(mockResult);

		const result = await getStudentsByClass(12345678, 'MANHA', '1A', 2025);

		expect(result).toEqual(mockResult);
		expect(result[0].data_nasc).toBeNull();
		expect(result[0].idade).toBeNull();
	});

	it('should filter by ano_letivo correctly', async () => {
		const { sql } = await import('$lib/server/db');
		const mockResult: StudentData[] = [
			{
				aluno_id: 1,
				nome: 'Diana Costa',
				data_nasc: new Date('2015-01-10'),
				idade: 10,
				has_visual_eval: true,
				has_anthropometric_eval: false,
				has_dental_eval: false
			}
		];

		(sql as any).mockResolvedValue(mockResult);

		const result = await getStudentsByClass(12345678, 'TARDE', '2B', 2024);

		expect(result).toEqual(mockResult);
		expect(sql).toHaveBeenCalled();
	});

	it('should only return active students', async () => {
		const { sql } = await import('$lib/server/db');
		const mockResult: StudentData[] = [
			{
				aluno_id: 1,
				nome: 'Eduardo Alves',
				data_nasc: new Date('2015-05-20'),
				idade: 10,
				has_visual_eval: false,
				has_anthropometric_eval: false,
				has_dental_eval: false
			}
		];

		(sql as any).mockResolvedValue(mockResult);

		const result = await getStudentsByClass(12345678, 'MANHA', '1A', 2025);

		expect(result).toEqual(mockResult);
		const callArgs = (sql as any).mock.calls[0];
		expect(callArgs[0].join('')).toContain('ativo = true');
	});

	it('should handle database errors gracefully', async () => {
		const { sql } = await import('$lib/server/db');
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		(sql as any).mockRejectedValue(new Error('Database error'));

		const result = await getStudentsByClass(12345678, 'MANHA', '1A', 2025);

		expect(result).toEqual([]);
		expect(consoleErrorSpy).toHaveBeenCalled();

		consoleErrorSpy.mockRestore();
	});
});
