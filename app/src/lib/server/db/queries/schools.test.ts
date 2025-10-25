import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSchoolsByUsf } from './schools';
import type { SchoolData } from './schools';

// Mock the database connection
vi.mock('$lib/server/db', () => ({
	sql: vi.fn()
}));

describe('getSchoolsByUsf', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should return schools list when usf_id is valid and has associated schools', async () => {
		const { sql } = await import('$lib/server/db');
		const mockResult: SchoolData[] = [
			{
				inep: 12345678,
				escola: 'Escola Municipal Teste',
				bairro: 'Centro',
				tipo: 'EM',
				total_alunos: 300,
				alunos_avaliados: 234
			},
			{
				inep: 87654321,
				escola: 'Escola Estadual Exemplo',
				bairro: 'Bairro Alto',
				tipo: 'EE',
				total_alunos: 150,
				alunos_avaliados: 75
			}
		];

		(sql as any).mockResolvedValue(mockResult);

		const result = await getSchoolsByUsf(1);

		expect(result).toEqual(mockResult);
		expect(result).toHaveLength(2);
		expect(result[0].total_alunos).toBe(300);
		expect(result[0].alunos_avaliados).toBe(234);
		// Verify sql was called
		expect(sql).toHaveBeenCalled();
		const callArgs = (sql as any).mock.calls[0];
		expect(callArgs[0].join('')).toContain('shared.escolas');
		expect(callArgs[0].join('')).toContain('pse.usf_escolas');
		expect(callArgs[0].join('')).toContain('pse.matriculas');
	});

	it('should return empty array when usf_id has no associated schools', async () => {
		const { sql } = await import('$lib/server/db');
		(sql as any).mockResolvedValue([]);

		const result = await getSchoolsByUsf(999);

		expect(result).toEqual([]);
		expect(result).toHaveLength(0);
	});

	it('should return empty array when usf_id is invalid (not positive number)', async () => {
		const { sql } = await import('$lib/server/db');
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		const result = await getSchoolsByUsf(-1);

		expect(result).toEqual([]);
		expect(sql).not.toHaveBeenCalled(); // Database should not be queried for invalid usf_id
		expect(consoleErrorSpy).toHaveBeenCalledWith('Invalid usf_id provided:', -1);

		consoleErrorSpy.mockRestore();
	});

	it('should return empty array when usf_id is zero', async () => {
		const { sql } = await import('$lib/server/db');
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		const result = await getSchoolsByUsf(0);

		expect(result).toEqual([]);
		expect(sql).not.toHaveBeenCalled();
		expect(consoleErrorSpy).toHaveBeenCalledWith('Invalid usf_id provided:', 0);

		consoleErrorSpy.mockRestore();
	});

	it('should filter out inactive relationships (is_ativo = false)', async () => {
		const { sql } = await import('$lib/server/db');
		// Mock result only contains active relationships
		const mockResult: SchoolData[] = [
			{
				inep: 12345678,
				escola: 'Escola Ativa',
				bairro: 'Centro',
				tipo: 'EM',
				total_alunos: 100,
				alunos_avaliados: 50
			}
		];

		(sql as any).mockResolvedValue(mockResult);

		const result = await getSchoolsByUsf(1);

		expect(result).toEqual(mockResult);
		// Verify the SQL query includes the is_ativo filter
		const callArgs = (sql as any).mock.calls[0];
		expect(callArgs[0].join('')).toContain('is_ativo');
	});

	it('should handle database errors gracefully', async () => {
		const { sql } = await import('$lib/server/db');
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		(sql as any).mockRejectedValue(new Error('Database connection failed'));

		const result = await getSchoolsByUsf(1);

		expect(result).toEqual([]);
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			'Error fetching schools for USF:',
			1,
			expect.any(Error)
		);

		consoleErrorSpy.mockRestore();
	});

	it('should return schools ordered by name (escola)', async () => {
		const { sql } = await import('$lib/server/db');
		const mockResult: SchoolData[] = [
			{
				inep: 11111111,
				escola: 'Escola A',
				bairro: 'Bairro 1',
				tipo: 'EM',
				total_alunos: 200,
				alunos_avaliados: 150
			},
			{
				inep: 22222222,
				escola: 'Escola B',
				bairro: 'Bairro 2',
				tipo: 'EE',
				total_alunos: 180,
				alunos_avaliados: 90
			}
		];

		(sql as any).mockResolvedValue(mockResult);

		const result = await getSchoolsByUsf(1);

		expect(result).toEqual(mockResult);
		// Verify ORDER BY is included in query
		const callArgs = (sql as any).mock.calls[0];
		expect(callArgs[0].join('')).toContain('ORDER BY');
	});

	it('should handle schools with null bairro and tipo', async () => {
		const { sql } = await import('$lib/server/db');
		const mockResult: SchoolData[] = [
			{
				inep: 12345678,
				escola: 'Escola Sem Bairro',
				bairro: null,
				tipo: null,
				total_alunos: 50,
				alunos_avaliados: 25
			}
		];

		(sql as any).mockResolvedValue(mockResult);

		const result = await getSchoolsByUsf(1);

		expect(result).toEqual(mockResult);
		expect(result[0].bairro).toBeNull();
		expect(result[0].tipo).toBeNull();
	});

	it('should correctly calculate students evaluated from any evaluation type', async () => {
		const { sql } = await import('$lib/server/db');
		const mockResult: SchoolData[] = [
			{
				inep: 12345678,
				escola: 'Escola Teste Avaliações',
				bairro: 'Centro',
				tipo: 'EM',
				total_alunos: 100,
				alunos_avaliados: 75 // Students with at least one evaluation
			}
		];

		(sql as any).mockResolvedValue(mockResult);

		const result = await getSchoolsByUsf(1);

		expect(result).toEqual(mockResult);
		expect(result[0].alunos_avaliados).toBe(75);
		// Verify query includes all evaluation tables
		const callArgs = (sql as any).mock.calls[0];
		expect(callArgs[0].join('')).toContain('avaliacoes_acuidade_visual');
		expect(callArgs[0].join('')).toContain('avaliacoes_antropometricas');
		expect(callArgs[0].join('')).toContain('avaliacoes_odontologicas');
	});

	it('should handle schools with no enrolled students', async () => {
		const { sql } = await import('$lib/server/db');
		const mockResult: SchoolData[] = [
			{
				inep: 12345678,
				escola: 'Escola Sem Alunos',
				bairro: 'Centro',
				tipo: 'EM',
				total_alunos: 0,
				alunos_avaliados: 0
			}
		];

		(sql as any).mockResolvedValue(mockResult);

		const result = await getSchoolsByUsf(1);

		expect(result).toEqual(mockResult);
		expect(result[0].total_alunos).toBe(0);
		expect(result[0].alunos_avaliados).toBe(0);
	});
});
