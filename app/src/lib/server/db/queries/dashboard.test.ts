import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	getAnthropometricStats,
	getVisualAcuityStats,
	getDentalRiskStats,
	getEvaluationCoverageStats
} from './dashboard';
import type {
	AnthropometricStatsResult,
	VisualAcuityStatsResult,
	DentalRiskStatsResult,
	EvaluationCoverageResult
} from './dashboard';

// Mock the database client
vi.mock('$lib/server/db/client', () => ({
	sql: vi.fn()
}));

describe('Dashboard Queries', () => {
	describe('getAnthropometricStats', () => {
		it('should return CDC classification distribution', async () => {
			const { sql } = await import('$lib/server/db/client');
			const mockSql = sql as unknown as ReturnType<typeof vi.fn>;

			mockSql.mockResolvedValueOnce([
				{ classificacao_cdc: 'Baixo Peso', count: '10' },
				{ classificacao_cdc: 'Peso Normal', count: '150' },
				{ classificacao_cdc: 'Sobrepeso', count: '30' },
				{ classificacao_cdc: 'Obesidade', count: '10' }
			]);

			const result = await getAnthropometricStats(2025);

			expect(result).toHaveLength(4);
			expect(result[0]).toMatchObject({
				classificacao: 'Baixo Peso',
				count: 10,
				percentage: expect.any(Number)
			});
			expect(result[0].percentage).toBeCloseTo(5.0, 1); // 10/200 = 5%
		});

		it('should calculate percentages correctly', async () => {
			const { sql } = await import('$lib/server/db/client');
			const mockSql = sql as unknown as ReturnType<typeof vi.fn>;

			mockSql.mockResolvedValueOnce([
				{ classificacao_cdc: 'Peso Normal', count: '50' },
				{ classificacao_cdc: 'Sobrepeso', count: '50' }
			]);

			const result = await getAnthropometricStats(2025);

			expect(result).toHaveLength(2);
			expect(result[0].percentage).toBe(50);
			expect(result[1].percentage).toBe(50);
		});

		it('should handle empty results gracefully', async () => {
			const { sql } = await import('$lib/server/db/client');
			const mockSql = sql as unknown as ReturnType<typeof vi.fn>;

			mockSql.mockResolvedValueOnce([]);

			const result = await getAnthropometricStats(2025);

			expect(result).toEqual([]);
		});

		it('should handle database errors gracefully', async () => {
			const { sql } = await import('$lib/server/db/client');
			const mockSql = sql as unknown as ReturnType<typeof vi.fn>;

			mockSql.mockRejectedValueOnce(new Error('Database connection failed'));

			const result = await getAnthropometricStats(2025);

			expect(result).toEqual([]);
		});
	});

	describe('getVisualAcuityStats', () => {
		it('should return visual acuity distribution by ranges', async () => {
			const { sql } = await import('$lib/server/db/client');
			const mockSql = sql as unknown as ReturnType<typeof vi.fn>;

			mockSql.mockResolvedValueOnce([
				{ acuity_range: '>= 1.0', olho_direito: '120', olho_esquerdo: '115' },
				{ acuity_range: '0.61-0.9', olho_direito: '25', olho_esquerdo: '30' },
				{ acuity_range: '<= 0.6', olho_direito: '15', olho_esquerdo: '20' }
			]);

			const result = await getVisualAcuityStats(2025);

			expect(result).toHaveLength(3);
			expect(result[0]).toMatchObject({
				acuity_range: '>= 1.0',
				olho_direito: 120,
				olho_esquerdo: 115
			});
			expect(result[2]).toMatchObject({
				acuity_range: '<= 0.6',
				olho_direito: 15,
				olho_esquerdo: 20
			});
		});

		it('should handle empty results gracefully', async () => {
			const { sql } = await import('$lib/server/db/client');
			const mockSql = sql as unknown as ReturnType<typeof vi.fn>;

			mockSql.mockResolvedValueOnce([]);

			const result = await getVisualAcuityStats(2025);

			expect(result).toEqual([]);
		});

		it('should handle database errors gracefully', async () => {
			const { sql } = await import('$lib/server/db/client');
			const mockSql = sql as unknown as ReturnType<typeof vi.fn>;

			mockSql.mockRejectedValueOnce(new Error('Database query failed'));

			const result = await getVisualAcuityStats(2025);

			expect(result).toEqual([]);
		});
	});

	describe('getDentalRiskStats', () => {
		it('should return dental risk distribution with percentages', async () => {
			const { sql } = await import('$lib/server/db/client');
			const mockSql = sql as unknown as ReturnType<typeof vi.fn>;

			mockSql.mockResolvedValueOnce([
				{ risco: 'A', count: '20' },
				{ risco: 'B', count: '30' },
				{ risco: 'C', count: '40' },
				{ risco: 'D', count: '10' }
			]);

			const result = await getDentalRiskStats(2025);

			expect(result).toHaveLength(4);
			expect(result[0]).toMatchObject({
				risco: 'A',
				count: 20,
				percentage: 20 // 20/100 = 20%
			});
			expect(result[2].percentage).toBe(40); // 40/100 = 40%
		});

		it('should handle empty results gracefully', async () => {
			const { sql } = await import('$lib/server/db/client');
			const mockSql = sql as unknown as ReturnType<typeof vi.fn>;

			mockSql.mockResolvedValueOnce([]);

			const result = await getDentalRiskStats(2025);

			expect(result).toEqual([]);
		});

		it('should handle database errors gracefully', async () => {
			const { sql } = await import('$lib/server/db/client');
			const mockSql = sql as unknown as ReturnType<typeof vi.fn>;

			mockSql.mockRejectedValueOnce(new Error('Database error'));

			const result = await getDentalRiskStats(2025);

			expect(result).toEqual([]);
		});
	});

	describe('getEvaluationCoverageStats', () => {
		it('should return evaluation coverage statistics', async () => {
			const { sql } = await import('$lib/server/db/client');
			const mockSql = sql as unknown as ReturnType<typeof vi.fn>;

			// Mock first call (total students)
			mockSql.mockResolvedValueOnce([{ total: '200' }]);

			// Mock second call (counts by type)
			mockSql.mockResolvedValueOnce([
				{
					anthropometric: '180',
					visual: '160',
					dental: '150'
				}
			]);

			const result = await getEvaluationCoverageStats(2025);

			expect(result).toMatchObject({
				total_students: 200,
				anthropometric_completed: 180,
				visual_completed: 160,
				dental_completed: 150,
				anthropometric_percentage: 90,
				visual_percentage: 80,
				dental_percentage: 75
			});
		});

		it('should handle zero students gracefully', async () => {
			const { sql } = await import('$lib/server/db/client');
			const mockSql = sql as unknown as ReturnType<typeof vi.fn>;

			mockSql.mockResolvedValueOnce([{ total: '0' }]);

			const result = await getEvaluationCoverageStats(2025);

			expect(result).toMatchObject({
				total_students: 0,
				anthropometric_completed: 0,
				visual_completed: 0,
				dental_completed: 0,
				anthropometric_percentage: 0,
				visual_percentage: 0,
				dental_percentage: 0
			});
		});

		it('should handle database errors gracefully', async () => {
			const { sql } = await import('$lib/server/db/client');
			const mockSql = sql as unknown as ReturnType<typeof vi.fn>;

			mockSql.mockRejectedValueOnce(new Error('Connection timeout'));

			const result = await getEvaluationCoverageStats(2025);

			expect(result).toBeNull();
		});
	});
});
