import { sql } from '$lib/server/db';
import { z } from 'zod';

/**
 * Visual Acuity Evaluation interface
 */
export interface AvaliacaoAcuidadeVisual {
	id: number;
	aluno_id: number;
	escola_id: number | null;
	profissional_id: number | null;
	usf_id: number | null;
	avaliado_em: Date;
	ano_referencia: number;
	olho_direito: number | null;
	olho_esquerdo: number | null;
	olho_direito_reteste: number | null;
	olho_esquerdo_reteste: number | null;
	tem_problema_od: boolean | null;
	tem_problema_oe: boolean | null;
	observacoes: string | null;
	created_at: Date;
	updated_at: Date;
}

/**
 * Validation schema for visual acuity evaluation data
 */
export const visualAcuityEvaluationSchema = z.object({
	aluno_id: z.number().positive(),
	escola_id: z.number().positive().nullable(),
	profissional_id: z.number().positive().nullable(),
	usf_id: z.number().positive().nullable(),
	ano_referencia: z.number().min(2000).max(2100),
	olho_direito: z.number().min(0).max(1.0).nullable(),
	olho_esquerdo: z.number().min(0).max(1.0).nullable(),
	olho_direito_reteste: z.number().min(0).max(1.0).nullable(),
	olho_esquerdo_reteste: z.number().min(0).max(1.0).nullable(),
	tem_problema_od: z.boolean().nullable(),
	tem_problema_oe: z.boolean().nullable(),
	observacoes: z.string().nullable()
});

/**
 * Save visual acuity evaluation for a student
 * Creates a new evaluation record (allows multiple evaluations per year for each semester)
 * Updates if evaluation already exists for today
 */
export async function saveVisualAcuityEvaluation(
	data: z.infer<typeof visualAcuityEvaluationSchema>
): Promise<AvaliacaoAcuidadeVisual | null> {
	try {
		// Validate input
		const validated = visualAcuityEvaluationSchema.parse(data);

		// Check if evaluation already exists for today
		const existing = await sql<AvaliacaoAcuidadeVisual[]>`
			SELECT * FROM pse.avaliacoes_acuidade_visual
			WHERE aluno_id = ${validated.aluno_id}
			AND ano_referencia = ${validated.ano_referencia}
			AND avaliado_em = CURRENT_DATE
			LIMIT 1
		`;

		if (existing.length > 0) {
			const existingRecord = existing[0];

			// Check if any field has changed
			const hasChanges =
				existingRecord.olho_direito !== validated.olho_direito ||
				existingRecord.olho_esquerdo !== validated.olho_esquerdo ||
				existingRecord.olho_direito_reteste !== validated.olho_direito_reteste ||
				existingRecord.olho_esquerdo_reteste !== validated.olho_esquerdo_reteste ||
				existingRecord.tem_problema_od !== validated.tem_problema_od ||
				existingRecord.tem_problema_oe !== validated.tem_problema_oe ||
				existingRecord.observacoes !== validated.observacoes;

			if (hasChanges) {
				// Update existing evaluation for today (allows corrections)
				const result = await sql<AvaliacaoAcuidadeVisual[]>`
					UPDATE pse.avaliacoes_acuidade_visual
					SET
						olho_direito = ${validated.olho_direito},
						olho_esquerdo = ${validated.olho_esquerdo},
						olho_direito_reteste = ${validated.olho_direito_reteste},
						olho_esquerdo_reteste = ${validated.olho_esquerdo_reteste},
						tem_problema_od = ${validated.tem_problema_od},
						tem_problema_oe = ${validated.tem_problema_oe},
						observacoes = ${validated.observacoes},
						updated_at = CURRENT_TIMESTAMP
					WHERE id = ${existingRecord.id}
					RETURNING *
				`;
				return result.length > 0 ? result[0] : null;
			} else {
				// No changes - return existing record without updating
				return existingRecord;
			}
		} else {
			// Insert new evaluation
			const result = await sql<AvaliacaoAcuidadeVisual[]>`
				INSERT INTO pse.avaliacoes_acuidade_visual (
					aluno_id, escola_id, profissional_id, usf_id,
					avaliado_em, ano_referencia, olho_direito, olho_esquerdo,
					olho_direito_reteste, olho_esquerdo_reteste,
					tem_problema_od, tem_problema_oe, observacoes
				)
				VALUES (
					${validated.aluno_id}, ${validated.escola_id},
					${validated.profissional_id}, ${validated.usf_id},
					CURRENT_DATE, ${validated.ano_referencia},
					${validated.olho_direito}, ${validated.olho_esquerdo},
					${validated.olho_direito_reteste}, ${validated.olho_esquerdo_reteste},
					${validated.tem_problema_od}, ${validated.tem_problema_oe},
					${validated.observacoes}
				)
				RETURNING *
			`;

			return result.length > 0 ? result[0] : null;
		}
	} catch (error) {
		console.error('saveVisualAcuityEvaluation error:', error);
		return null;
	}
}

/**
 * Get most recent visual acuity evaluation for a student in a specific year
 */
export async function getVisualAcuityEvaluation(
	alunoId: number,
	anoReferencia: number
): Promise<AvaliacaoAcuidadeVisual | null> {
	try {
		// Get most recent evaluation for this year
		const result = await sql<AvaliacaoAcuidadeVisual[]>`
			SELECT * FROM pse.avaliacoes_acuidade_visual
			WHERE aluno_id = ${alunoId}
			AND ano_referencia = ${anoReferencia}
			ORDER BY avaliado_em DESC, id DESC
			LIMIT 1
		`;

		return result.length > 0 ? result[0] : null;
	} catch (error) {
		console.error('getVisualAcuityEvaluation error:', error);
		return null;
	}
}
