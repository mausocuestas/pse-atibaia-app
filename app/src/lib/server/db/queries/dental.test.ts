import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	saveDentalEvaluation,
	getDentalEvaluation,
	dentalEvaluationSchema
} from './dental';
import type { AvaliacaoOdontologica } from '$lib/server/db/types';
import { sql } from '$lib/server/db';

// Mock the database sql function
vi.mock('$lib/server/db', () => ({
	sql: vi.fn()
}));

describe('Dental Evaluation Query Functions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('dentalEvaluationSchema', () => {
		it('should validate valid dental evaluation data with all fields', () => {
			const validData = {
				aluno_id: 1,
				escola_id: 100,
				profissional_id: 50,
				usf_id: 25,
				ano_referencia: 2025,
				risco: 'B' as const,
				complemento: '+' as const,
				classificacao_completa: 'B+',
				recebeu_atf: true,
				precisa_art: true,
				qtde_dentes_art: 3,
				has_escovacao: true,
				observacoes: 'Necessita tratamento'
			};

			const result = dentalEvaluationSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('should validate dental evaluation data with minimal fields', () => {
			const validData = {
				aluno_id: 1,
				escola_id: 100,
				profissional_id: null,
				usf_id: null,
				ano_referencia: 2025,
				risco: 'A' as const,
				complemento: null,
				classificacao_completa: 'A',
				recebeu_atf: false,
				precisa_art: false,
				qtde_dentes_art: 0,
				has_escovacao: false,
				observacoes: null
			};

			const result = dentalEvaluationSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('should validate dental evaluation with complemento negative', () => {
			const validData = {
				aluno_id: 1,
				escola_id: 100,
				profissional_id: null,
				usf_id: null,
				ano_referencia: 2025,
				risco: 'C' as const,
				complemento: '-' as const,
				classificacao_completa: 'C-',
				recebeu_atf: false,
				precisa_art: false,
				qtde_dentes_art: 0,
				has_escovacao: true,
				observacoes: null
			};

			const result = dentalEvaluationSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('should reject invalid risco value', () => {
			const invalidData = {
				aluno_id: 1,
				escola_id: 100,
				profissional_id: null,
				usf_id: null,
				ano_referencia: 2025,
				risco: 'H', // Invalid: not in A-G range
				complemento: null,
				classificacao_completa: null,
				recebeu_atf: false,
				precisa_art: false,
				qtde_dentes_art: 0,
				has_escovacao: false,
				observacoes: null
			};

			const result = dentalEvaluationSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it('should reject invalid complemento value', () => {
			const invalidData = {
				aluno_id: 1,
				escola_id: 100,
				profissional_id: null,
				usf_id: null,
				ano_referencia: 2025,
				risco: 'B' as const,
				complemento: '*', // Invalid: not + or -
				classificacao_completa: 'B*',
				recebeu_atf: false,
				precisa_art: false,
				qtde_dentes_art: 0,
				has_escovacao: false,
				observacoes: null
			};

			const result = dentalEvaluationSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it('should reject negative qtde_dentes_art', () => {
			const invalidData = {
				aluno_id: 1,
				escola_id: 100,
				profissional_id: null,
				usf_id: null,
				ano_referencia: 2025,
				risco: 'D' as const,
				complemento: null,
				classificacao_completa: 'D',
				recebeu_atf: false,
				precisa_art: true,
				qtde_dentes_art: -1, // Invalid: negative
				has_escovacao: false,
				observacoes: null
			};

			const result = dentalEvaluationSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it('should reject qtde_dentes_art greater than 32', () => {
			const invalidData = {
				aluno_id: 1,
				escola_id: 100,
				profissional_id: null,
				usf_id: null,
				ano_referencia: 2025,
				risco: 'G' as const,
				complemento: null,
				classificacao_completa: 'G',
				recebeu_atf: false,
				precisa_art: true,
				qtde_dentes_art: 33, // Invalid: > 32
				has_escovacao: false,
				observacoes: null
			};

			const result = dentalEvaluationSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it('should reject qtde_dentes_art > 0 when precisa_art is false (custom refine)', () => {
			const invalidData = {
				aluno_id: 1,
				escola_id: 100,
				profissional_id: null,
				usf_id: null,
				ano_referencia: 2025,
				risco: 'A' as const,
				complemento: null,
				classificacao_completa: 'A',
				recebeu_atf: false,
				precisa_art: false, // False
				qtde_dentes_art: 5, // But qtde_dentes_art > 0 - should fail
				has_escovacao: false,
				observacoes: null
			};

			const result = dentalEvaluationSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it('should accept qtde_dentes_art > 0 when precisa_art is true', () => {
			const validData = {
				aluno_id: 1,
				escola_id: 100,
				profissional_id: null,
				usf_id: null,
				ano_referencia: 2025,
				risco: 'D' as const,
				complemento: '+' as const,
				classificacao_completa: 'D+',
				recebeu_atf: false,
				precisa_art: true, // True
				qtde_dentes_art: 5, // qtde_dentes_art > 0 is valid when precisa_art = true
				has_escovacao: true,
				observacoes: null
			};

			const result = dentalEvaluationSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('should reject invalid aluno_id', () => {
			const invalidData = {
				aluno_id: -1, // Invalid: negative
				escola_id: 100,
				profissional_id: null,
				usf_id: null,
				ano_referencia: 2025,
				risco: 'A' as const,
				complemento: null,
				classificacao_completa: 'A',
				recebeu_atf: false,
				precisa_art: false,
				qtde_dentes_art: 0,
				has_escovacao: false,
				observacoes: null
			};

			const result = dentalEvaluationSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it('should reject invalid year', () => {
			const invalidData = {
				aluno_id: 1,
				escola_id: 100,
				profissional_id: null,
				usf_id: null,
				ano_referencia: 1999, // Invalid: < 2000
				risco: 'A' as const,
				complemento: null,
				classificacao_completa: 'A',
				recebeu_atf: false,
				precisa_art: false,
				qtde_dentes_art: 0,
				has_escovacao: false,
				observacoes: null
			};

			const result = dentalEvaluationSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});
	});

	describe('saveDentalEvaluation', () => {
		it('should save valid dental evaluation data with all fields', async () => {
			const mockResult: AvaliacaoOdontologica = {
				id: 1,
				aluno_id: 123,
				escola_id: 100,
				profissional_id: 50,
				usf_id: 25,
				avaliado_em: new Date(),
				ano_referencia: 2025,
				risco: 'B',
				complemento: '+',
				classificacao_completa: 'B+',
				recebeu_atf: true,
				precisa_art: true,
				qtde_dentes_art: 3,
				has_escovacao: true,
				observacoes: 'Necessita tratamento',
				created_at: new Date(),
				updated_at: new Date()
			};

			vi.mocked(sql).mockResolvedValue([mockResult] as any);

			const data = {
				aluno_id: 123,
				escola_id: 100,
				profissional_id: 50,
				usf_id: 25,
				ano_referencia: 2025,
				risco: 'B' as const,
				complemento: '+' as const,
				classificacao_completa: 'B+',
				recebeu_atf: true,
				precisa_art: true,
				qtde_dentes_art: 3,
				has_escovacao: true,
				observacoes: 'Necessita tratamento'
			};

			const result = await saveDentalEvaluation(data);

			expect(result).toEqual(mockResult);
			expect(sql).toHaveBeenCalledTimes(1);
		});

		it('should save dental evaluation with minimal data (risco only)', async () => {
			const mockResult: AvaliacaoOdontologica = {
				id: 2,
				aluno_id: 456,
				escola_id: 100,
				profissional_id: null,
				usf_id: null,
				avaliado_em: new Date(),
				ano_referencia: 2025,
				risco: 'A',
				complemento: null,
				classificacao_completa: 'A',
				recebeu_atf: false,
				precisa_art: false,
				qtde_dentes_art: 0,
				has_escovacao: false,
				observacoes: null,
				created_at: new Date(),
				updated_at: new Date()
			};

			vi.mocked(sql).mockResolvedValue([mockResult] as any);

			const data = {
				aluno_id: 456,
				escola_id: 100,
				profissional_id: null,
				usf_id: null,
				ano_referencia: 2025,
				risco: 'A' as const,
				complemento: null,
				classificacao_completa: 'A',
				recebeu_atf: false,
				precisa_art: false,
				qtde_dentes_art: 0,
				has_escovacao: false,
				observacoes: null
			};

			const result = await saveDentalEvaluation(data);

			expect(result).toEqual(mockResult);
			expect(sql).toHaveBeenCalledTimes(1);
		});

		it('should return null when validation fails (invalid risco)', async () => {
			const invalidData = {
				aluno_id: 123,
				escola_id: 100,
				profissional_id: null,
				usf_id: null,
				ano_referencia: 2025,
				risco: 'Z' as any, // Invalid risco
				complemento: null,
				classificacao_completa: null,
				recebeu_atf: false,
				precisa_art: false,
				qtde_dentes_art: 0,
				has_escovacao: false,
				observacoes: null
			};

			const result = await saveDentalEvaluation(invalidData);

			expect(result).toBeNull();
			expect(sql).not.toHaveBeenCalled();
		});

		it('should return null when precisa_art = false and qtde_dentes_art > 0', async () => {
			const invalidData = {
				aluno_id: 123,
				escola_id: 100,
				profissional_id: null,
				usf_id: null,
				ano_referencia: 2025,
				risco: 'A' as const,
				complemento: null,
				classificacao_completa: 'A',
				recebeu_atf: false,
				precisa_art: false, // False
				qtde_dentes_art: 5, // But > 0 - should fail validation
				has_escovacao: false,
				observacoes: null
			};

			const result = await saveDentalEvaluation(invalidData);

			expect(result).toBeNull();
			expect(sql).not.toHaveBeenCalled();
		});

		it('should handle database errors gracefully', async () => {
			vi.mocked(sql).mockRejectedValue(new Error('Database connection failed'));

			const data = {
				aluno_id: 123,
				escola_id: 100,
				profissional_id: null,
				usf_id: null,
				ano_referencia: 2025,
				risco: 'B' as const,
				complemento: null,
				classificacao_completa: 'B',
				recebeu_atf: false,
				precisa_art: false,
				qtde_dentes_art: 0,
				has_escovacao: false,
				observacoes: null
			};

			const result = await saveDentalEvaluation(data);

			expect(result).toBeNull();
			expect(sql).toHaveBeenCalledTimes(1);
		});

		it('should update existing evaluation on same day if data changes', async () => {
			const existingRecord: AvaliacaoOdontologica = {
				id: 1,
				aluno_id: 123,
				escola_id: 100,
				profissional_id: 50,
				usf_id: 25,
				avaliado_em: new Date(),
				ano_referencia: 2025,
				risco: 'B',
				complemento: null,
				classificacao_completa: 'B',
				recebeu_atf: false,
				precisa_art: false,
				qtde_dentes_art: 0,
				has_escovacao: false,
				observacoes: 'Valor incorreto',
				created_at: new Date(),
				updated_at: new Date()
			};

			const updatedRecord: AvaliacaoOdontologica = {
				...existingRecord,
				risco: 'C',
				classificacao_completa: 'C+',
				complemento: '+',
				precisa_art: true,
				qtde_dentes_art: 2,
				observacoes: 'Valor corrigido',
				updated_at: new Date()
			};

			// First call returns existing record, second call returns updated record
			vi.mocked(sql)
				.mockResolvedValueOnce([existingRecord] as any) // Check for existing
				.mockResolvedValueOnce([updatedRecord] as any); // Update

			const data = {
				aluno_id: 123,
				escola_id: 100,
				profissional_id: 50,
				usf_id: 25,
				ano_referencia: 2025,
				risco: 'C' as const, // Changed
				complemento: '+' as const, // Changed
				classificacao_completa: 'C+', // Changed
				recebeu_atf: false,
				precisa_art: true, // Changed
				qtde_dentes_art: 2, // Changed
				has_escovacao: false,
				observacoes: 'Valor corrigido' // Changed
			};

			const result = await saveDentalEvaluation(data);

			expect(result).toEqual(updatedRecord);
			expect(result?.risco).toBe('C');
			expect(result?.qtde_dentes_art).toBe(2);
			expect(result?.observacoes).toBe('Valor corrigido');
			expect(sql).toHaveBeenCalledTimes(2); // Once for check, once for update
		});

		it('should return existing record without update if no data changes on same day', async () => {
			const existingRecord: AvaliacaoOdontologica = {
				id: 1,
				aluno_id: 123,
				escola_id: 100,
				profissional_id: 50,
				usf_id: 25,
				avaliado_em: new Date(),
				ano_referencia: 2025,
				risco: 'B',
				complemento: '+',
				classificacao_completa: 'B+',
				recebeu_atf: true,
				precisa_art: false,
				qtde_dentes_art: 0,
				has_escovacao: true,
				observacoes: 'Dados corretos',
				created_at: new Date(),
				updated_at: new Date()
			};

			// Only one call - check for existing record
			vi.mocked(sql).mockResolvedValueOnce([existingRecord] as any);

			const data = {
				aluno_id: 123,
				escola_id: 100,
				profissional_id: 50,
				usf_id: 25,
				ano_referencia: 2025,
				risco: 'B' as const, // Same as existing
				complemento: '+' as const, // Same as existing
				classificacao_completa: 'B+', // Same as existing
				recebeu_atf: true, // Same as existing
				precisa_art: false, // Same as existing
				qtde_dentes_art: 0, // Same as existing
				has_escovacao: true, // Same as existing
				observacoes: 'Dados corretos' // Same as existing
			};

			const result = await saveDentalEvaluation(data);

			expect(result).toEqual(existingRecord);
			expect(sql).toHaveBeenCalledTimes(1); // Only check, no update needed
		});

		it('should create new evaluation on different day (allows multiple per year)', async () => {
			const newEvaluation: AvaliacaoOdontologica = {
				id: 2,
				aluno_id: 123,
				escola_id: 100,
				profissional_id: 50,
				usf_id: 25,
				avaliado_em: new Date(),
				ano_referencia: 2025,
				risco: 'C',
				complemento: '-',
				classificacao_completa: 'C-',
				recebeu_atf: false,
				precisa_art: true,
				qtde_dentes_art: 1,
				has_escovacao: true,
				observacoes: 'Segunda avaliação no mesmo ano',
				created_at: new Date(),
				updated_at: new Date()
			};

			// Mock: no existing record for today, so INSERT happens
			vi.mocked(sql)
				.mockResolvedValueOnce([] as any) // Check returns empty (no record for today)
				.mockResolvedValueOnce([newEvaluation] as any); // INSERT new record

			const data = {
				aluno_id: 123,
				escola_id: 100,
				profissional_id: 50,
				usf_id: 25,
				ano_referencia: 2025,
				risco: 'C' as const,
				complemento: '-' as const,
				classificacao_completa: 'C-',
				recebeu_atf: false,
				precisa_art: true,
				qtde_dentes_art: 1,
				has_escovacao: true,
				observacoes: 'Segunda avaliação no mesmo ano'
			};

			const result = await saveDentalEvaluation(data);

			expect(result).toEqual(newEvaluation);
			expect(result?.observacoes).toBe('Segunda avaliação no mesmo ano');
			expect(sql).toHaveBeenCalledTimes(2); // Once for check, once for insert
		});

		it('should test classificacao_completa generation (risco + complemento)', async () => {
			const mockResult: AvaliacaoOdontologica = {
				id: 1,
				aluno_id: 123,
				escola_id: 100,
				profissional_id: null,
				usf_id: null,
				avaliado_em: new Date(),
				ano_referencia: 2025,
				risco: 'D',
				complemento: '+',
				classificacao_completa: 'D+',
				recebeu_atf: false,
				precisa_art: false,
				qtde_dentes_art: 0,
				has_escovacao: false,
				observacoes: null,
				created_at: new Date(),
				updated_at: new Date()
			};

			vi.mocked(sql).mockResolvedValue([mockResult] as any);

			const data = {
				aluno_id: 123,
				escola_id: 100,
				profissional_id: null,
				usf_id: null,
				ano_referencia: 2025,
				risco: 'D' as const,
				complemento: '+' as const,
				classificacao_completa: 'D+', // Risco + Complemento
				recebeu_atf: false,
				precisa_art: false,
				qtde_dentes_art: 0,
				has_escovacao: false,
				observacoes: null
			};

			const result = await saveDentalEvaluation(data);

			expect(result?.classificacao_completa).toBe('D+');
			expect(sql).toHaveBeenCalledTimes(1);
		});
	});

	describe('getDentalEvaluation', () => {
		it('should return dental evaluation for existing student', async () => {
			const mockResult: AvaliacaoOdontologica = {
				id: 1,
				aluno_id: 123,
				escola_id: 100,
				profissional_id: 50,
				usf_id: 25,
				avaliado_em: new Date(),
				ano_referencia: 2025,
				risco: 'B',
				complemento: '+',
				classificacao_completa: 'B+',
				recebeu_atf: true,
				precisa_art: false,
				qtde_dentes_art: 0,
				has_escovacao: true,
				observacoes: 'Avaliação normal',
				created_at: new Date(),
				updated_at: new Date()
			};

			vi.mocked(sql).mockResolvedValue([mockResult] as any);

			const result = await getDentalEvaluation(123, 2025);

			expect(result).toEqual(mockResult);
			expect(sql).toHaveBeenCalledTimes(1);
		});

		it('should return null for non-existent evaluation', async () => {
			vi.mocked(sql).mockResolvedValue([] as any);

			const result = await getDentalEvaluation(999, 2025);

			expect(result).toBeNull();
			expect(sql).toHaveBeenCalledTimes(1);
		});

		it('should handle database errors gracefully', async () => {
			vi.mocked(sql).mockRejectedValue(new Error('Database connection failed'));

			const result = await getDentalEvaluation(123, 2025);

			expect(result).toBeNull();
			expect(sql).toHaveBeenCalledTimes(1);
		});

		it('should return most recent evaluation when multiple exist for same year', async () => {
			const mockRecentEvaluation: AvaliacaoOdontologica = {
				id: 2,
				aluno_id: 123,
				escola_id: 100,
				profissional_id: 50,
				usf_id: 25,
				avaliado_em: new Date('2025-06-15'), // More recent
				ano_referencia: 2025,
				risco: 'C',
				complemento: null,
				classificacao_completa: 'C',
				recebeu_atf: false,
				precisa_art: true,
				qtde_dentes_art: 2,
				has_escovacao: true,
				observacoes: 'Avaliação mais recente',
				created_at: new Date('2025-06-15'),
				updated_at: new Date('2025-06-15')
			};

			vi.mocked(sql).mockResolvedValue([mockRecentEvaluation] as any);

			const result = await getDentalEvaluation(123, 2025);

			expect(result).toEqual(mockRecentEvaluation);
			expect(result?.observacoes).toBe('Avaliação mais recente');
			expect(sql).toHaveBeenCalledTimes(1);
		});

		it('should return evaluation for correct year', async () => {
			const mockResult2024: AvaliacaoOdontologica = {
				id: 1,
				aluno_id: 123,
				escola_id: 100,
				profissional_id: 50,
				usf_id: 25,
				avaliado_em: new Date('2024-05-01'),
				ano_referencia: 2024,
				risco: 'A',
				complemento: null,
				classificacao_completa: 'A',
				recebeu_atf: false,
				precisa_art: false,
				qtde_dentes_art: 0,
				has_escovacao: false,
				observacoes: 'Avaliação 2024',
				created_at: new Date('2024-05-01'),
				updated_at: new Date('2024-05-01')
			};

			vi.mocked(sql).mockResolvedValue([mockResult2024] as any);

			const result = await getDentalEvaluation(123, 2024);

			expect(result).toEqual(mockResult2024);
			expect(result?.ano_referencia).toBe(2024);
			expect(sql).toHaveBeenCalledTimes(1);
		});
	});
});
