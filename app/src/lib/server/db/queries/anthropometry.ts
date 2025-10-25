/**
 * Database query functions for anthropometry evaluations
 */

import { sql } from '$lib/server/db';
import { z } from 'zod';
import type { AvaliacaoAntropometrica } from '$lib/server/db/types';

/**
 * Validation schema for anthropometry evaluation data
 */
export const anthropometryEvaluationSchema = z.object({
	aluno_id: z.number().positive(),
	escola_id: z.number().positive().nullable(),
	profissional_id: z.number().positive().nullable(),
	usf_id: z.number().positive().nullable(),
	ano_referencia: z.number().min(2000).max(2100),
	peso_kg: z.number().positive().max(300),
	altura_cm: z.number().positive().max(250),
	data_nascimento: z.date(),
	sexo: z.enum(['M', 'F']),
	imc: z.number().nullable(),
	classificacao_cdc: z.string().max(30).nullable(),
	observacoes: z.string().nullable()
});

export type AnthropometryEvaluationInput = z.infer<typeof anthropometryEvaluationSchema>;

/**
 * Save or update anthropometry evaluation for a student
 * Uses UPSERT logic based on aluno_id and ano_referencia (unique constraint)
 *
 * @param data - Anthropometry evaluation data
 * @returns Saved evaluation record or null on error
 */
export async function saveAnthropometryEvaluation(
	data: AnthropometryEvaluationInput
): Promise<AvaliacaoAntropometrica | null> {
	try {
		// Validate input
		const validated = anthropometryEvaluationSchema.parse(data);

		// Upsert query - insert or update if record exists
		const result = await sql<AvaliacaoAntropometrica[]>`
      INSERT INTO pse.avaliacoes_antropometricas (
        aluno_id, escola_id, profissional_id, usf_id,
        avaliado_em, ano_referencia, peso_kg, altura_cm,
        data_nascimento, sexo, imc, classificacao_cdc, observacoes
      )
      VALUES (
        ${validated.aluno_id}, ${validated.escola_id},
        ${validated.profissional_id}, ${validated.usf_id},
        CURRENT_DATE, ${validated.ano_referencia},
        ${validated.peso_kg}, ${validated.altura_cm},
        ${validated.data_nascimento}, ${validated.sexo},
        ${validated.imc}, ${validated.classificacao_cdc},
        ${validated.observacoes}
      )
      ON CONFLICT (aluno_id, ano_referencia)
      DO UPDATE SET
        peso_kg = EXCLUDED.peso_kg,
        altura_cm = EXCLUDED.altura_cm,
        imc = EXCLUDED.imc,
        classificacao_cdc = EXCLUDED.classificacao_cdc,
        observacoes = EXCLUDED.observacoes,
        avaliado_em = CURRENT_DATE,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

		return result.length > 0 ? result[0] : null;
	} catch (error) {
		console.error('saveAnthropometryEvaluation error:', error);
		return null;
	}
}

/**
 * Get anthropometry evaluation for a student in a specific year
 *
 * @param alunoId - Student ID
 * @param anoReferencia - Reference year (e.g., 2025)
 * @returns Evaluation record or null if not found
 */
export async function getAnthropometryEvaluation(
	alunoId: number,
	anoReferencia: number
): Promise<AvaliacaoAntropometrica | null> {
	try {
		// Validate inputs
		const schema = z.object({
			alunoId: z.number().positive(),
			anoReferencia: z.number().min(2000).max(2100)
		});

		const validationResult = schema.safeParse({ alunoId, anoReferencia });
		if (!validationResult.success) {
			console.error('Validation error in getAnthropometryEvaluation:', validationResult.error);
			return null;
		}

		// Execute query
		const result = await sql<AvaliacaoAntropometrica[]>`
      SELECT * FROM pse.avaliacoes_antropometricas
      WHERE aluno_id = ${alunoId}
      AND ano_referencia = ${anoReferencia}
      LIMIT 1
    `;

		return result.length > 0 ? result[0] : null;
	} catch (error) {
		console.error('getAnthropometryEvaluation error:', error);
		return null;
	}
}
