import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveAnthropometryEvaluation, getAnthropometryEvaluation } from './anthropometry';
import type { AvaliacaoAntropometrica } from '$lib/server/db/types';

// Mock the sql tagged template
vi.mock('$lib/server/db', () => ({
	sql: vi.fn()
}));

import { sql } from '$lib/server/db';

describe('anthropometry query functions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('saveAnthropometryEvaluation', () => {
		const validData = {
			aluno_id: 123,
			escola_id: 456,
			profissional_id: 789,
			usf_id: 101,
			ano_referencia: 2025,
			peso_kg: 30.5,
			altura_cm: 140.0,
			data_nascimento: new Date('2015-06-15'),
			sexo: 'M' as const,
			imc: 15.31,
			classificacao_cdc: 'Peso Normal',
			observacoes: 'Teste de observação'
		};

		it('should successfully save anthropometry evaluation', async () => {
			const mockResult: AvaliacaoAntropometrica = {
				id: 1,
				aluno_id: validData.aluno_id,
				escola_id: validData.escola_id,
				profissional_id: validData.profissional_id,
				usf_id: validData.usf_id,
				avaliado_em: new Date(),
				ano_referencia: validData.ano_referencia,
				peso_kg: validData.peso_kg,
				altura_cm: validData.altura_cm,
				data_nascimento: validData.data_nascimento,
				sexo: validData.sexo,
				imc: validData.imc,
				classificacao_cdc: validData.classificacao_cdc,
				observacoes: validData.observacoes,
				created_at: new Date(),
				updated_at: new Date()
			};

			vi.mocked(sql).mockResolvedValue([mockResult] as any);

			const result = await saveAnthropometryEvaluation(validData);

			expect(result).toEqual(mockResult);
			expect(sql).toHaveBeenCalledOnce();
		});

		it('should handle upsert behavior (update on conflict)', async () => {
			const updatedData = { ...validData, peso_kg: 35.0, altura_cm: 145.0 };

			const mockResult: AvaliacaoAntropometrica = {
				id: 1,
				aluno_id: updatedData.aluno_id,
				escola_id: updatedData.escola_id,
				profissional_id: updatedData.profissional_id,
				usf_id: updatedData.usf_id,
				avaliado_em: new Date(),
				ano_referencia: updatedData.ano_referencia,
				peso_kg: updatedData.peso_kg,
				altura_cm: updatedData.altura_cm,
				data_nascimento: updatedData.data_nascimento,
				sexo: updatedData.sexo,
				imc: 16.63,
				classificacao_cdc: 'Peso Normal',
				observacoes: updatedData.observacoes,
				created_at: new Date(),
				updated_at: new Date()
			};

			vi.mocked(sql).mockResolvedValue([mockResult] as any);

			const result = await saveAnthropometryEvaluation(updatedData);

			expect(result).toEqual(mockResult);
			expect(result?.peso_kg).toBe(35.0);
		});

		it('should return null on validation error (invalid peso)', async () => {
			const invalidData = { ...validData, peso_kg: -10 }; // Negative weight

			const result = await saveAnthropometryEvaluation(invalidData);

			expect(result).toBeNull();
			expect(sql).not.toHaveBeenCalled();
		});

		it('should return null on validation error (peso exceeds max)', async () => {
			const invalidData = { ...validData, peso_kg: 400 }; // Exceeds max 300

			const result = await saveAnthropometryEvaluation(invalidData);

			expect(result).toBeNull();
			expect(sql).not.toHaveBeenCalled();
		});

		it('should return null on validation error (invalid altura)', async () => {
			const invalidData = { ...validData, altura_cm: 0 }; // Zero height

			const result = await saveAnthropometryEvaluation(invalidData);

			expect(result).toBeNull();
			expect(sql).not.toHaveBeenCalled();
		});

		it('should return null on validation error (altura exceeds max)', async () => {
			const invalidData = { ...validData, altura_cm: 300 }; // Exceeds max 250

			const result = await saveAnthropometryEvaluation(invalidData);

			expect(result).toBeNull();
			expect(sql).not.toHaveBeenCalled();
		});

		it('should handle null escola_id, profissional_id, usf_id', async () => {
			const dataWithNulls = {
				...validData,
				escola_id: null,
				profissional_id: null,
				usf_id: null
			};

			const mockResult: AvaliacaoAntropometrica = {
				id: 1,
				aluno_id: dataWithNulls.aluno_id,
				escola_id: null,
				profissional_id: null,
				usf_id: null,
				avaliado_em: new Date(),
				ano_referencia: dataWithNulls.ano_referencia,
				peso_kg: dataWithNulls.peso_kg,
				altura_cm: dataWithNulls.altura_cm,
				data_nascimento: dataWithNulls.data_nascimento,
				sexo: dataWithNulls.sexo,
				imc: dataWithNulls.imc,
				classificacao_cdc: dataWithNulls.classificacao_cdc,
				observacoes: dataWithNulls.observacoes,
				created_at: new Date(),
				updated_at: new Date()
			};

			vi.mocked(sql).mockResolvedValue([mockResult] as any);

			const result = await saveAnthropometryEvaluation(dataWithNulls);

			expect(result).toEqual(mockResult);
		});

		it('should return null on database error', async () => {
			vi.mocked(sql).mockRejectedValue(new Error('Database error'));

			const result = await saveAnthropometryEvaluation(validData);

			expect(result).toBeNull();
		});
	});

	describe('getAnthropometryEvaluation', () => {
		it('should return evaluation when found', async () => {
			const mockResult: AvaliacaoAntropometrica = {
				id: 1,
				aluno_id: 123,
				escola_id: 456,
				profissional_id: 789,
				usf_id: 101,
				avaliado_em: new Date(),
				ano_referencia: 2025,
				peso_kg: 30.5,
				altura_cm: 140.0,
				data_nascimento: new Date('2015-06-15'),
				sexo: 'M',
				imc: 15.31,
				classificacao_cdc: 'Peso Normal',
				observacoes: 'Test observation',
				created_at: new Date(),
				updated_at: new Date()
			};

			vi.mocked(sql).mockResolvedValue([mockResult] as any);

			const result = await getAnthropometryEvaluation(123, 2025);

			expect(result).toEqual(mockResult);
			expect(sql).toHaveBeenCalledOnce();
		});

		it('should return null when no evaluation found', async () => {
			vi.mocked(sql).mockResolvedValue([] as any);

			const result = await getAnthropometryEvaluation(999, 2025);

			expect(result).toBeNull();
		});

		it('should return null on validation error (invalid alunoId)', async () => {
			const result = await getAnthropometryEvaluation(-1, 2025);

			expect(result).toBeNull();
			expect(sql).not.toHaveBeenCalled();
		});

		it('should return null on validation error (invalid year)', async () => {
			const result = await getAnthropometryEvaluation(123, 1999); // Before min year 2000

			expect(result).toBeNull();
			expect(sql).not.toHaveBeenCalled();
		});

		it('should return null on validation error (future year)', async () => {
			const result = await getAnthropometryEvaluation(123, 2150); // After max year 2100

			expect(result).toBeNull();
			expect(sql).not.toHaveBeenCalled();
		});

		it('should return null on database error', async () => {
			vi.mocked(sql).mockRejectedValue(new Error('Database connection failed'));

			const result = await getAnthropometryEvaluation(123, 2025);

			expect(result).toBeNull();
		});
	});
});
