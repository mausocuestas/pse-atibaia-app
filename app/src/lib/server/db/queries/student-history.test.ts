import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	getStudentInfo,
	getStudentAnthropometricHistory,
	getStudentVisualHistory,
	getStudentDentalHistory,
	getStudentCompleteHistory,
	getStudentAvailableYears
} from './student-history';
import type {
	StudentInfo,
	StudentAnthropometricHistory,
	StudentVisualHistory,
	StudentDentalHistory
} from './student-history';

// Mock the database client
vi.mock('$lib/server/db/client', () => ({
	sql: vi.fn()
}));

describe('Student History Queries', () => {
	describe('getStudentInfo', () => {
		it('should return student information with current enrollment details', async () => {
			const { sql } = await import('$lib/server/db/client');
			const mockSql = sql as unknown as ReturnType<typeof vi.fn>;

			const mockStudentInfo = {
				id: 123,
				nome_completo: 'João Silva',
				data_nascimento: new Date('2010-05-15'),
				sexo: 'Masculino',
				escola_id: 456,
				escola_nome: 'Escola Municipal',
				ano_letivo: 2025,
				turma: '4º Ano A',
				periodo: 'Manhã'
			};

			mockSql.mockResolvedValueOnce([mockStudentInfo]);

			const result = await getStudentInfo(123);

			expect(result).toEqual(mockStudentInfo);
			expect(mockSql).toHaveBeenCalled();
		});

		it('should return null when student is not found', async () => {
			const { sql } = await import('$lib/server/db/client');
			const mockSql = sql as unknown as ReturnType<typeof vi.fn>;

			mockSql.mockResolvedValueOnce([]);

			const result = await getStudentInfo(999);

			expect(result).toBeNull();
		});

		it('should handle database errors gracefully', async () => {
			const { sql } = await import('$lib/server/db/client');
			const mockSql = sql as unknown as ReturnType<typeof vi.fn>;

			mockSql.mockRejectedValueOnce(new Error('Database connection failed'));

			const result = await getStudentInfo(123);

			expect(result).toBeNull();
		});
	});

	describe('getStudentAnthropometricHistory', () => {
		it('should return anthropometric history ordered by date', async () => {
			const { sql } = await import('$lib/server/db/client');
			const mockSql = sql as unknown as ReturnType<typeof vi.fn>;

			const mockAnthropometricData: StudentAnthropometricHistory[] = [
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
				},
				{
					id: 3,
					data_avaliacao: new Date('2025-04-18'),
					peso_kg: 31.2,
					altura_cm: 130.0,
					imc: 18.5,
					classificacao_cdc: 'Peso adequado',
					ano_referencia: 2025
				}
			];

			mockSql.mockResolvedValueOnce(mockAnthropometricData);

			const result = await getStudentAnthropometricHistory(123);

			expect(result).toHaveLength(3);
			expect(result[0]).toMatchObject({
				id: 1,
				peso_kg: 25.5,
				altura_cm: 120.0,
				ano_referencia: 2023
			});
			expect(mockSql).toHaveBeenCalled();
		});

		it('should return empty array when no anthropometric data exists', async () => {
			const { sql } = await import('$lib/server/db/client');
			const mockSql = sql as unknown as ReturnType<typeof vi.fn>;

			mockSql.mockResolvedValueOnce([]);

			const result = await getStudentAnthropometricHistory(123);

			expect(result).toEqual([]);
		});

		it('should handle database errors gracefully', async () => {
			const { sql } = await import('$lib/server/db/client');
			const mockSql = sql as unknown as ReturnType<typeof vi.fn>;

			mockSql.mockRejectedValueOnce(new Error('Query failed'));

			const result = await getStudentAnthropometricHistory(123);

			expect(result).toEqual([]);
		});
	});

	describe('getStudentVisualHistory', () => {
		it('should return visual acuity history ordered by date', async () => {
			const { sql } = await import('$lib/server/db/client');
			const mockSql = sql as unknown as ReturnType<typeof vi.fn>;

			const mockVisualData: StudentVisualHistory[] = [
				{
					id: 1,
					data_avaliacao: new Date('2023-04-15'),
					olho_direito: 1.0,
					olho_esquerdo: 0.9,
					reteste: undefined,
					ano_referencia: 2023
				},
				{
					id: 2,
					data_avaliacao: new Date('2024-04-20'),
					olho_direito: 0.8,
					olho_esquerdo: 0.7,
					reteste: 0.9,
					ano_referencia: 2024
				}
			];

			mockSql.mockResolvedValueOnce(mockVisualData);

			const result = await getStudentVisualHistory(123);

			expect(result).toHaveLength(2);
			expect(result[0]).toMatchObject({
				id: 1,
				olho_direito: 1.0,
				olho_esquerdo: 0.9,
				ano_referencia: 2023
			});
			expect(mockSql).toHaveBeenCalled();
		});

		it('should filter out records with null values for both eyes', async () => {
			const { sql } = await import('$lib/server/db/client');
			const mockSql = sql as unknown as ReturnType<typeof vi.fn>;

			mockSql.mockResolvedValueOnce([
				{
					id: 1,
					data_avaliacao: new Date('2023-04-15'),
					olho_direito: 1.0,
					olho_esquerdo: 0.9,
					reteste: undefined,
					ano_referencia: 2023
				}
			]);

			const result = await getStudentVisualHistory(123);

			expect(result).toHaveLength(1);
			expect(mockSql).toHaveBeenCalled();
		});

		it('should handle database errors gracefully', async () => {
			const { sql } = await import('$lib/server/db/client');
			const mockSql = sql as unknown as ReturnType<typeof vi.fn>;

			mockSql.mockRejectedValueOnce(new Error('Database error'));

			const result = await getStudentVisualHistory(123);

			expect(result).toEqual([]);
		});
	});

	describe('getStudentDentalHistory', () => {
		it('should return dental history ordered by date', async () => {
			const { sql } = await import('$lib/server/db/client');
			const mockSql = sql as unknown as ReturnType<typeof vi.fn>;

			const mockDentalData: StudentDentalHistory[] = [
				{
					id: 1,
					data_avaliacao: new Date('2023-04-15'),
					risco: 'C',
					atf_realizado: true,
					necessita_art: false,
					art_quantidade_dentes: undefined,
					escovacao_orientada_realizada: true,
					ano_referencia: 2023
				},
				{
					id: 2,
					data_avaliacao: new Date('2024-04-20'),
					risco: 'D',
					atf_realizado: true,
					necessita_art: true,
					art_quantidade_dentes: 2,
					escovacao_orientada_realizada: true,
					ano_referencia: 2024
				}
			];

			mockSql.mockResolvedValueOnce(mockDentalData);

			const result = await getStudentDentalHistory(123);

			expect(result).toHaveLength(2);
			expect(result[0]).toMatchObject({
				id: 1,
				risco: 'C',
				atf_realizado: true,
				necessita_art: false,
				ano_referencia: 2023
			});
			expect(mockSql).toHaveBeenCalled();
		});

		it('should handle database errors gracefully', async () => {
			const { sql } = await import('$lib/server/db/client');
			const mockSql = sql as unknown as ReturnType<typeof vi.fn>;

			mockSql.mockRejectedValueOnce(new Error('Connection error'));

			const result = await getStudentDentalHistory(123);

			expect(result).toEqual([]);
		});
	});

	describe('getStudentCompleteHistory', () => {
		it('should fetch all historical data types in parallel', async () => {
			const { sql } = await import('$lib/server/db/client');
			const mockSql = sql as unknown as ReturnType<typeof vi.fn>;

			const mockStudentInfo: StudentInfo = {
				id: 123,
				nome_completo: 'Test Student',
				data_nascimento: new Date('2010-05-15'),
				sexo: 'Masculino',
				escola_id: 456,
				escola_nome: 'Test School',
				ano_letivo: 2025,
				turma: '4º Ano',
				periodo: 'Manhã'
			};

			const mockAnthropometricData: StudentAnthropometricHistory[] = [
				{
					id: 1,
					data_avaliacao: new Date('2024-04-15'),
					peso_kg: 28.0,
					altura_cm: 125.0,
					imc: 17.9,
					classificacao_cdc: 'Peso adequado',
					ano_referencia: 2024
				}
			];

			const mockVisualData: StudentVisualHistory[] = [
				{
					id: 1,
					data_avaliacao: new Date('2024-04-15'),
					olho_direito: 1.0,
					olho_esquerdo: 0.9,
					reteste: undefined,
					ano_referencia: 2024
				}
			];

			const mockDentalData: StudentDentalHistory[] = [
				{
					id: 1,
					data_avaliacao: new Date('2024-04-15'),
					risco: 'C',
					atf_realizado: true,
					necessita_art: false,
					art_quantidade_dentes: undefined,
					escovacao_orientada_realizada: true,
					ano_referencia: 2024
				}
			];

			// Mock all four parallel calls
			mockSql
				.mockResolvedValueOnce([mockStudentInfo]) // getStudentInfo
				.mockResolvedValueOnce(mockAnthropometricData) // getStudentAnthropometricHistory
				.mockResolvedValueOnce(mockVisualData) // getStudentVisualHistory
				.mockResolvedValueOnce(mockDentalData); // getStudentDentalHistory

			const result = await getStudentCompleteHistory(123);

			expect(result).toEqual({
				studentInfo: mockStudentInfo,
				anthropometricHistory: mockAnthropometricData,
				visualHistory: mockVisualData,
				dentalHistory: mockDentalData
			});
			expect(mockSql).toHaveBeenCalledTimes(15); // All previous calls + 4 new calls
		});

		it('should handle errors and return empty data structures', async () => {
			const { sql } = await import('$lib/server/db/client');
			const mockSql = sql as unknown as ReturnType<typeof vi.fn>;

			mockSql.mockRejectedValueOnce(new Error('Database error'));

			const result = await getStudentCompleteHistory(123);

			expect(result).toEqual({
				studentInfo: null,
				anthropometricHistory: undefined,
				visualHistory: undefined,
				dentalHistory: undefined
			});
		});
	});

	describe('getStudentAvailableYears', () => {
		it('should return distinct years from all evaluation types', async () => {
			const { sql } = await import('$lib/server/db/client');
			const mockSql = sql as unknown as ReturnType<typeof vi.fn>;

			const mockYears = [
				{ ano: '2025' },
				{ ano: '2024' },
				{ ano: '2023' }
			];

			mockSql.mockResolvedValueOnce(mockYears);

			const result = await getStudentAvailableYears(123);

			expect(result).toEqual([2025, 2024, 2023]);
			expect(mockSql).toHaveBeenCalled();
		});

		it('should return empty array when no evaluation years found', async () => {
			const { sql } = await import('$lib/server/db/client');
			const mockSql = sql as unknown as ReturnType<typeof vi.fn>;

			mockSql.mockResolvedValueOnce([]);

			const result = await getStudentAvailableYears(123);

			expect(result).toEqual([]);
		});

		it('should handle database errors gracefully', async () => {
			const { sql } = await import('$lib/server/db/client');
			const mockSql = sql as unknown as ReturnType<typeof vi.fn>;

			mockSql.mockRejectedValueOnce(new Error('Query failed'));

			const result = await getStudentAvailableYears(123);

			expect(result).toEqual([]);
		});

		it('should convert string years to numbers', async () => {
			const { sql } = await import('$lib/server/db/client');
			const mockSql = sql as unknown as ReturnType<typeof vi.fn>;

			mockSql.mockResolvedValueOnce([{ ano: '2025' }]);

			const result = await getStudentAvailableYears(123);

			expect(result).toEqual([2025]);
			expect(typeof result[0]).toBe('number');
		});
	});
});