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
 * Creates a new evaluation record (allows multiple evaluations per year for each semester)
 * Updates if evaluation already exists for today
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

		// Check if evaluation already exists for today
		const existing = await sql<AvaliacaoAntropometrica[]>`
			SELECT * FROM pse.avaliacoes_antropometricas
			WHERE aluno_id = ${validated.aluno_id}
			AND ano_referencia = ${validated.ano_referencia}
			AND avaliado_em = CURRENT_DATE
			LIMIT 1
		`;

		if (existing.length > 0) {
			const existingRecord = existing[0];

			// Check if any field has changed
			const hasChanges =
				Number(existingRecord.peso_kg) !== validated.peso_kg ||
				Number(existingRecord.altura_cm) !== validated.altura_cm ||
				Number(existingRecord.imc) !== validated.imc ||
				existingRecord.classificacao_cdc !== validated.classificacao_cdc ||
				existingRecord.observacoes !== validated.observacoes;

			if (hasChanges) {
				// Update existing evaluation for today (allows corrections)
				const result = await sql<AvaliacaoAntropometrica[]>`
					UPDATE pse.avaliacoes_antropometricas
					SET
						peso_kg = ${validated.peso_kg},
						altura_cm = ${validated.altura_cm},
						imc = ${validated.imc},
						classificacao_cdc = ${validated.classificacao_cdc},
						observacoes = ${validated.observacoes},
						data_nascimento = ${validated.data_nascimento},
						sexo = ${validated.sexo},
						updated_at = CURRENT_TIMESTAMP
					WHERE id = ${existingRecord.id}
					RETURNING *
				`;

				console.log('✏️ Updated existing anthropometry evaluation for today');
				return result.length > 0 ? result[0] : null;
			} else {
				// No changes detected, return existing record
				console.log('ℹ️ No changes detected, returning existing record');
				return existingRecord;
			}
		}

		// Insert new evaluation record (allows multiple per year)
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
			RETURNING *
		`;

		console.log('✅ Created new anthropometry evaluation');
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
