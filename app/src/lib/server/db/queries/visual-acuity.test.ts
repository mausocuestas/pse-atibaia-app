import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	saveVisualAcuityEvaluation,
	getVisualAcuityEvaluation,
	visualAcuityEvaluationSchema,
	type AvaliacaoAcuidadeVisual
} from './visual-acuity';
import { sql } from '$lib/server/db';

// Mock the database sql function
vi.mock('$lib/server/db', () => ({
	sql: vi.fn()
}));

describe('Visual Acuity Query Functions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('visualAcuityEvaluationSchema', () => {
		it('should validate valid visual acuity data with all fields', () => {
			const validData = {
				aluno_id: 1,
				escola_id: 100,
				profissional_id: 50,
				usf_id: 25,
				ano_referencia: 2025,
				olho_direito: 1.0,
				olho_esquerdo: 1.0,
				olho_direito_reteste: 0.9,
				olho_esquerdo_reteste: 0.95,
				tem_problema_od: false,
				tem_problema_oe: false,
				observacoes: 'Avaliação normal'
			};

			const result = visualAcuityEvaluationSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('should validate visual acuity data with only initial measurements', () => {
			const validData = {
				aluno_id: 1,
				escola_id: 100,
				profissional_id: null,
				usf_id: null,
				ano_referencia: 2025,
				olho_direito: 0.8,
				olho_esquerdo: 0.9,
				olho_direito_reteste: null,
				olho_esquerdo_reteste: null,
				tem_problema_od: null,
				tem_problema_oe: null,
				observacoes: null
			};

			const result = visualAcuityEvaluationSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('should validate visual acuity data with only reteste measurements', () => {
			const validData = {
				aluno_id: 1,
				escola_id: 100,
				profissional_id: null,
				usf_id: null,
				ano_referencia: 2025,
				olho_direito: null,
				olho_esquerdo: null,
				olho_direito_reteste: 0.7,
				olho_esquerdo_reteste: 0.8,
				tem_problema_od: null,
				tem_problema_oe: null,
				observacoes: null
			};

			const result = visualAcuityEvaluationSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('should reject negative visual acuity values', () => {
			const invalidData = {
				aluno_id: 1,
				escola_id: 100,
				profissional_id: null,
				usf_id: null,
				ano_referencia: 2025,
				olho_direito: -0.5,
				olho_esquerdo: 1.0,
				olho_direito_reteste: null,
				olho_esquerdo_reteste: null,
				tem_problema_od: null,
				tem_problema_oe: null,
				observacoes: null
			};

			const result = visualAcuityEvaluationSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it('should reject visual acuity values greater than 2.0', () => {
			const invalidData = {
				aluno_id: 1,
				escola_id: 100,
				profissional_id: null,
				usf_id: null,
				ano_referencia: 2025,
				olho_direito: 2.5,
				olho_esquerdo: 1.0,
				olho_direito_reteste: null,
				olho_esquerdo_reteste: null,
				tem_problema_od: null,
				tem_problema_oe: null,
				observacoes: null
			};

			const result = visualAcuityEvaluationSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it('should reject invalid aluno_id', () => {
			const invalidData = {
				aluno_id: -1,
				escola_id: 100,
				profissional_id: null,
				usf_id: null,
				ano_referencia: 2025,
				olho_direito: 1.0,
				olho_esquerdo: 1.0,
				olho_direito_reteste: null,
				olho_esquerdo_reteste: null,
				tem_problema_od: null,
				tem_problema_oe: null,
				observacoes: null
			};

			const result = visualAcuityEvaluationSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it('should reject invalid year', () => {
			const invalidData = {
				aluno_id: 1,
				escola_id: 100,
				profissional_id: null,
				usf_id: null,
				ano_referencia: 1999,
				olho_direito: 1.0,
				olho_esquerdo: 1.0,
				olho_direito_reteste: null,
				olho_esquerdo_reteste: null,
				tem_problema_od: null,
				tem_problema_oe: null,
				observacoes: null
			};

			const result = visualAcuityEvaluationSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});
	});

	describe('saveVisualAcuityEvaluation', () => {
		it('should save valid visual acuity data with all fields', async () => {
			const mockResult: AvaliacaoAcuidadeVisual = {
				id: 1,
				aluno_id: 123,
				escola_id: 100,
				profissional_id: 50,
				usf_id: 25,
				avaliado_em: new Date(),
				ano_referencia: 2025,
				olho_direito: 1.0,
				olho_esquerdo: 1.0,
				olho_direito_reteste: 0.9,
				olho_esquerdo_reteste: 0.95,
				tem_problema_od: false,
				tem_problema_oe: false,
				observacoes: 'Avaliação normal',
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
				olho_direito: 1.0,
				olho_esquerdo: 1.0,
				olho_direito_reteste: 0.9,
				olho_esquerdo_reteste: 0.95,
				tem_problema_od: false,
				tem_problema_oe: false,
				observacoes: 'Avaliação normal'
			};

			const result = await saveVisualAcuityEvaluation(data);

			expect(result).toEqual(mockResult);
			expect(sql).toHaveBeenCalledTimes(1);
		});

		it('should save visual acuity data with only initial measurements', async () => {
			const mockResult: AvaliacaoAcuidadeVisual = {
				id: 2,
				aluno_id: 456,
				escola_id: 100,
				profissional_id: null,
				usf_id: null,
				avaliado_em: new Date(),
				ano_referencia: 2025,
				olho_direito: 0.8,
				olho_esquerdo: 0.9,
				olho_direito_reteste: null,
				olho_esquerdo_reteste: null,
				tem_problema_od: false,
				tem_problema_oe: false,
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
				olho_direito: 0.8,
				olho_esquerdo: 0.9,
				olho_direito_reteste: null,
				olho_esquerdo_reteste: null,
				tem_problema_od: false,
				tem_problema_oe: false,
				observacoes: null
			};

			const result = await saveVisualAcuityEvaluation(data);

			expect(result).toEqual(mockResult);
			expect(sql).toHaveBeenCalledTimes(1);
		});

		it('should save visual acuity data with only reteste measurements', async () => {
			const mockResult: AvaliacaoAcuidadeVisual = {
				id: 3,
				aluno_id: 789,
				escola_id: 100,
				profissional_id: null,
				usf_id: null,
				avaliado_em: new Date(),
				ano_referencia: 2025,
				olho_direito: null,
				olho_esquerdo: null,
				olho_direito_reteste: 0.7,
				olho_esquerdo_reteste: 0.8,
				tem_problema_od: true,
				tem_problema_oe: false,
				observacoes: 'Reteste necessário',
				created_at: new Date(),
				updated_at: new Date()
			};

			vi.mocked(sql).mockResolvedValue([mockResult] as any);

			const data = {
				aluno_id: 789,
				escola_id: 100,
				profissional_id: null,
				usf_id: null,
				ano_referencia: 2025,
				olho_direito: null,
				olho_esquerdo: null,
				olho_direito_reteste: 0.7,
				olho_esquerdo_reteste: 0.8,
				tem_problema_od: true,
				tem_problema_oe: false,
				observacoes: 'Reteste necessário'
			};

			const result = await saveVisualAcuityEvaluation(data);

			expect(result).toEqual(mockResult);
			expect(sql).toHaveBeenCalledTimes(1);
		});

		it('should return null when validation fails', async () => {
			const invalidData = {
				aluno_id: -1, // Invalid: negative aluno_id
				escola_id: 100,
				profissional_id: null,
				usf_id: null,
				ano_referencia: 2025,
				olho_direito: 1.0,
				olho_esquerdo: 1.0,
				olho_direito_reteste: null,
				olho_esquerdo_reteste: null,
				tem_problema_od: null,
				tem_problema_oe: null,
				observacoes: null
			};

			const result = await saveVisualAcuityEvaluation(invalidData);

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
				olho_direito: 1.0,
				olho_esquerdo: 1.0,
				olho_direito_reteste: null,
				olho_esquerdo_reteste: null,
				tem_problema_od: null,
				tem_problema_oe: null,
				observacoes: null
			};

			const result = await saveVisualAcuityEvaluation(data);

			expect(result).toBeNull();
			expect(sql).toHaveBeenCalledTimes(1);
		});

		it('should create new evaluation on different day (allows multiple per year)', async () => {
			const newEvaluation: AvaliacaoAcuidadeVisual = {
				id: 2,
				aluno_id: 123,
				escola_id: 100,
				profissional_id: 50,
				usf_id: 25,
				avaliado_em: new Date(),
				ano_referencia: 2025,
				olho_direito: 0.9,
				olho_esquerdo: 0.95,
				olho_direito_reteste: null,
				olho_esquerdo_reteste: null,
				tem_problema_od: false,
				tem_problema_oe: false,
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
				olho_direito: 0.9,
				olho_esquerdo: 0.95,
				olho_direito_reteste: null,
				olho_esquerdo_reteste: null,
				tem_problema_od: false,
				tem_problema_oe: false,
				observacoes: 'Segunda avaliação no mesmo ano'
			};

			const result = await saveVisualAcuityEvaluation(data);

			expect(result).toEqual(newEvaluation);
			expect(result?.observacoes).toBe('Segunda avaliação no mesmo ano');
			expect(sql).toHaveBeenCalledTimes(2); // Once for check, once for insert
		});

		it('should update existing evaluation on same day if data changes (allows corrections)', async () => {
			const existingRecord: AvaliacaoAcuidadeVisual = {
				id: 1,
				aluno_id: 123,
				escola_id: 100,
				profissional_id: 50,
				usf_id: 25,
				avaliado_em: new Date(),
				ano_referencia: 2025,
				olho_direito: 0.8,
				olho_esquerdo: 0.9,
				olho_direito_reteste: null,
				olho_esquerdo_reteste: null,
				tem_problema_od: false,
				tem_problema_oe: false,
				observacoes: 'Valor incorreto',
				created_at: new Date(),
				updated_at: new Date()
			};

			const updatedRecord: AvaliacaoAcuidadeVisual = {
				...existingRecord,
				olho_direito: 1.0,
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
				olho_direito: 1.0, // Changed from 0.8
				olho_esquerdo: 0.9,
				olho_direito_reteste: null,
				olho_esquerdo_reteste: null,
				tem_problema_od: false,
				tem_problema_oe: false,
				observacoes: 'Valor corrigido' // Changed
			};

			const result = await saveVisualAcuityEvaluation(data);

			expect(result).toEqual(updatedRecord);
			expect(result?.olho_direito).toBe(1.0);
			expect(result?.observacoes).toBe('Valor corrigido');
			expect(sql).toHaveBeenCalledTimes(2); // Once for check, once for update
		});

		it('should return existing record without update if no data changes on same day', async () => {
			const existingRecord: AvaliacaoAcuidadeVisual = {
				id: 1,
				aluno_id: 123,
				escola_id: 100,
				profissional_id: 50,
				usf_id: 25,
				avaliado_em: new Date(),
				ano_referencia: 2025,
				olho_direito: 0.8,
				olho_esquerdo: 0.9,
				olho_direito_reteste: null,
				olho_esquerdo_reteste: null,
				tem_problema_od: false,
				tem_problema_oe: false,
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
				olho_direito: 0.8, // Same as existing
				olho_esquerdo: 0.9, // Same as existing
				olho_direito_reteste: null,
				olho_esquerdo_reteste: null,
				tem_problema_od: false,
				tem_problema_oe: false,
				observacoes: 'Dados corretos' // Same as existing
			};

			const result = await saveVisualAcuityEvaluation(data);

			expect(result).toEqual(existingRecord);
			expect(sql).toHaveBeenCalledTimes(1); // Only check, no update needed
		});
	});

	describe('getVisualAcuityEvaluation', () => {
		it('should return visual acuity evaluation for existing student', async () => {
			const mockResult: AvaliacaoAcuidadeVisual = {
				id: 1,
				aluno_id: 123,
				escola_id: 100,
				profissional_id: 50,
				usf_id: 25,
				avaliado_em: new Date(),
				ano_referencia: 2025,
				olho_direito: 1.0,
				olho_esquerdo: 1.0,
				olho_direito_reteste: null,
				olho_esquerdo_reteste: null,
				tem_problema_od: false,
				tem_problema_oe: false,
				observacoes: 'Avaliação normal',
				created_at: new Date(),
				updated_at: new Date()
			};

			vi.mocked(sql).mockResolvedValue([mockResult] as any);

			const result = await getVisualAcuityEvaluation(123, 2025);

			expect(result).toEqual(mockResult);
			expect(sql).toHaveBeenCalledTimes(1);
		});

		it('should return null for non-existent evaluation', async () => {
			vi.mocked(sql).mockResolvedValue([] as any);

			const result = await getVisualAcuityEvaluation(999, 2025);

			expect(result).toBeNull();
			expect(sql).toHaveBeenCalledTimes(1);
		});

		it('should handle database errors gracefully', async () => {
			vi.mocked(sql).mockRejectedValue(new Error('Database connection failed'));

			const result = await getVisualAcuityEvaluation(123, 2025);

			expect(result).toBeNull();
			expect(sql).toHaveBeenCalledTimes(1);
		});

		it('should return evaluation for correct year', async () => {
			const mockResult2024: AvaliacaoAcuidadeVisual = {
				id: 1,
				aluno_id: 123,
				escola_id: 100,
				profissional_id: 50,
				usf_id: 25,
				avaliado_em: new Date('2024-05-01'),
				ano_referencia: 2024,
				olho_direito: 0.9,
				olho_esquerdo: 0.8,
				olho_direito_reteste: null,
				olho_esquerdo_reteste: null,
				tem_problema_od: false,
				tem_problema_oe: false,
				observacoes: 'Avaliação 2024',
				created_at: new Date('2024-05-01'),
				updated_at: new Date('2024-05-01')
			};

			vi.mocked(sql).mockResolvedValue([mockResult2024] as any);

			const result = await getVisualAcuityEvaluation(123, 2024);

			expect(result).toEqual(mockResult2024);
			expect(result?.ano_referencia).toBe(2024);
			expect(sql).toHaveBeenCalledTimes(1);
		});
	});
});
