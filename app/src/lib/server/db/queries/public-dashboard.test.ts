/**
 * PUBLIC DASHBOARD TESTS - Security-focused anonymization tests
 *
 * CRITICAL: These tests verify that NO PII is exposed in public queries
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	getPublicAnthropometricStats,
	getPublicVisualAcuityStats,
	getPublicDentalRiskStats,
	getPublicEvaluationCoverageStats
} from './public-dashboard';

// Mock the sql tagged template
vi.mock('$lib/server/db/client', () => ({
	sql: vi.fn()
}));

import { sql } from '$lib/server/db/client';

describe('PUBLIC Dashboard Queries - Anonymization Security Tests', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('getPublicAnthropometricStats', () => {
		it('should return ONLY aggregated classification data without PII', async () => {
			const mockDbResult = [
				{ classificacao_cdc: 'Peso Normal', count: '45' },
				{ classificacao_cdc: 'Sobrepeso', count: '12' },
				{ classificacao_cdc: 'Obesidade', count: '8' }
			];

			vi.mocked(sql).mockResolvedValue(mockDbResult as any);

			const result = await getPublicAnthropometricStats(2025);

			// SECURITY CHECK: Verify NO PII fields in results
			expect(result).toBeDefined();
			expect(result).toHaveLength(3);
			result.forEach((item) => {
				expect(item).toHaveProperty('classificacao');
				expect(item).toHaveProperty('count');
				expect(item).toHaveProperty('percentage');

				// CRITICAL: Verify NO PII fields
				expect(item).not.toHaveProperty('id');
				expect(item).not.toHaveProperty('aluno_id');
				expect(item).not.toHaveProperty('nome');
				expect(item).not.toHaveProperty('nome_completo');
				expect(item).not.toHaveProperty('cpf');
				expect(item).not.toHaveProperty('data_nascimento');

				// Verify data types
				expect(typeof item.classificacao).toBe('string');
				expect(typeof item.count).toBe('number');
				expect(typeof item.percentage).toBe('number');
			});

			expect(sql).toHaveBeenCalledOnce();
		});

		it('should calculate percentages correctly', async () => {
			const mockDbResult = [
				{ classificacao_cdc: 'Peso Normal', count: '80' },
				{ classificacao_cdc: 'Sobrepeso', count: '20' }
			];

			vi.mocked(sql).mockResolvedValue(mockDbResult as any);

			const result = await getPublicAnthropometricStats(2025);

			expect(result[0].percentage).toBeCloseTo(80.0);
			expect(result[1].percentage).toBeCloseTo(20.0);
		});

		it('should handle empty results gracefully', async () => {
			vi.mocked(sql).mockResolvedValue([] as any);

			const result = await getPublicAnthropometricStats(2025);

			expect(result).toEqual([]);
		});

		it('should handle database errors gracefully', async () => {
			vi.mocked(sql).mockRejectedValue(new Error('Database connection failed'));

			const result = await getPublicAnthropometricStats(2025);

			expect(result).toEqual([]);
		});
	});

	describe('getPublicVisualAcuityStats', () => {
		it('should return ONLY aggregated acuity ranges without PII', async () => {
			const mockDbResult = [
				{ acuity_range: '>= 1.0', olho_direito: '50', olho_esquerdo: '48' },
				{ acuity_range: '0.61-0.9', olho_direito: '25', olho_esquerdo: '27' },
				{ acuity_range: '<= 0.6', olho_direito: '10', olho_esquerdo: '12' }
			];

			vi.mocked(sql).mockResolvedValue(mockDbResult as any);

			const result = await getPublicVisualAcuityStats(2025);

			// SECURITY CHECK: Verify NO PII fields in results
			expect(result).toBeDefined();
			expect(result).toHaveLength(3);
			result.forEach((item) => {
				expect(item).toHaveProperty('acuity_range');
				expect(item).toHaveProperty('olho_direito');
				expect(item).toHaveProperty('olho_esquerdo');

				// CRITICAL: Verify NO PII fields
				expect(item).not.toHaveProperty('id');
				expect(item).not.toHaveProperty('aluno_id');
				expect(item).not.toHaveProperty('nome');
				expect(item).not.toHaveProperty('data_avaliacao');

				// Verify data types
				expect(typeof item.acuity_range).toBe('string');
				expect(typeof item.olho_direito).toBe('number');
				expect(typeof item.olho_esquerdo).toBe('number');
			});

			expect(sql).toHaveBeenCalledOnce();
		});

		it('should handle empty results gracefully', async () => {
			vi.mocked(sql).mockResolvedValue([] as any);

			const result = await getPublicVisualAcuityStats(2025);

			expect(result).toEqual([]);
		});
	});

	describe('getPublicDentalRiskStats', () => {
		it('should return ONLY aggregated risk classifications without PII', async () => {
			const mockDbResult = [
				{ risco: 'A', count: '30' },
				{ risco: 'B', count: '25' },
				{ risco: 'C', count: '15' },
				{ risco: 'D', count: '10' }
			];

			vi.mocked(sql).mockResolvedValue(mockDbResult as any);

			const result = await getPublicDentalRiskStats(2025);

			// SECURITY CHECK: Verify NO PII fields in results
			expect(result).toBeDefined();
			expect(result).toHaveLength(4);
			result.forEach((item) => {
				expect(item).toHaveProperty('risco');
				expect(item).toHaveProperty('count');
				expect(item).toHaveProperty('percentage');

				// CRITICAL: Verify NO PII fields
				expect(item).not.toHaveProperty('id');
				expect(item).not.toHaveProperty('aluno_id');
				expect(item).not.toHaveProperty('nome');
				expect(item).not.toHaveProperty('profissional_id');
				expect(item).not.toHaveProperty('escola_id');

				// Verify data types
				expect(typeof item.risco).toBe('string');
				expect(typeof item.count).toBe('number');
				expect(typeof item.percentage).toBe('number');
			});

			expect(sql).toHaveBeenCalledOnce();
		});

		it('should calculate percentages correctly', async () => {
			const mockDbResult = [
				{ risco: 'A', count: '60' },
				{ risco: 'B', count: '40' }
			];

			vi.mocked(sql).mockResolvedValue(mockDbResult as any);

			const result = await getPublicDentalRiskStats(2025);

			expect(result[0].percentage).toBeCloseTo(60.0);
			expect(result[1].percentage).toBeCloseTo(40.0);
		});
	});

	describe('getPublicEvaluationCoverageStats', () => {
		it('should return ONLY aggregated counts and percentages without PII', async () => {
			const mockTotalResult = [{ total: '100' }];
			const mockCountsResult = [
				{
					anthropometric: '85',
					visual: '90',
					dental: '75'
				}
			];

			vi.mocked(sql)
				.mockResolvedValueOnce(mockTotalResult as any)
				.mockResolvedValueOnce(mockCountsResult as any);

			const result = await getPublicEvaluationCoverageStats(2025);

			// SECURITY CHECK: Verify NO PII fields in results
			expect(result).toBeDefined();
			expect(result).toHaveProperty('total_students');
			expect(result).toHaveProperty('anthropometric_completed');
			expect(result).toHaveProperty('visual_completed');
			expect(result).toHaveProperty('dental_completed');
			expect(result).toHaveProperty('anthropometric_percentage');
			expect(result).toHaveProperty('visual_percentage');
			expect(result).toHaveProperty('dental_percentage');

			// CRITICAL: Verify NO PII fields or student IDs
			expect(result).not.toHaveProperty('aluno_ids');
			expect(result).not.toHaveProperty('nomes');
			expect(result).not.toHaveProperty('escola_ids');

			// Verify counts
			expect(result?.total_students).toBe(100);
			expect(result?.anthropometric_completed).toBe(85);
			expect(result?.visual_completed).toBe(90);
			expect(result?.dental_completed).toBe(75);

			// Verify percentages
			expect(result?.anthropometric_percentage).toBeCloseTo(85.0);
			expect(result?.visual_percentage).toBeCloseTo(90.0);
			expect(result?.dental_percentage).toBeCloseTo(75.0);

			expect(sql).toHaveBeenCalledTimes(2);
		});

		it('should handle zero students gracefully', async () => {
			const mockTotalResult = [{ total: '0' }];

			vi.mocked(sql).mockResolvedValueOnce(mockTotalResult as any);

			const result = await getPublicEvaluationCoverageStats(2025);

			expect(result).toEqual({
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
			vi.mocked(sql).mockRejectedValue(new Error('Database error'));

			const result = await getPublicEvaluationCoverageStats(2025);

			expect(result).toBeNull();
		});
	});

	describe('CRITICAL SECURITY TESTS - PII Exposure Prevention', () => {
		it('should NEVER return student IDs in any public query', async () => {
			const mockResults = [{ classificacao_cdc: 'Peso Normal', count: '10' }];
			vi.mocked(sql).mockResolvedValue(mockResults as any);

			const anthroResult = await getPublicAnthropometricStats(2025);

			// Verify no result contains ID fields
			const serialized = JSON.stringify(anthroResult);
			expect(serialized).not.toContain('"id"');
			expect(serialized).not.toContain('"aluno_id"');
			expect(serialized).not.toContain('_id');
		});

		it('should NEVER return student names in any public query', async () => {
			const mockResults = [{ risco: 'A', count: '5' }];
			vi.mocked(sql).mockResolvedValue(mockResults as any);

			const dentalResult = await getPublicDentalRiskStats(2025);

			const serialized = JSON.stringify(dentalResult);
			expect(serialized).not.toContain('"nome"');
			expect(serialized).not.toContain('"nome_completo"');
			expect(serialized).not.toContain('"cliente"');
		});

		it('should NEVER return dates of birth in any public query', async () => {
			const mockResults = [{ acuity_range: '>= 1.0', olho_direito: '10', olho_esquerdo: '10' }];
			vi.mocked(sql).mockResolvedValue(mockResults as any);

			const visualResult = await getPublicVisualAcuityStats(2025);

			const serialized = JSON.stringify(visualResult);
			expect(serialized).not.toContain('"data_nascimento"');
			expect(serialized).not.toContain('"data_nasc"');
			expect(serialized).not.toContain('"cpf"');
			expect(serialized).not.toContain('"nis"');
		});
	});
});
