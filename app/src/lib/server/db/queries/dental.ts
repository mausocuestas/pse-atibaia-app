import { sql } from '$lib/server/db';
import { z } from 'zod';
import type { AvaliacaoOdontologica } from '$lib/server/db/types';

/**
 * Validation schema for dental evaluation data
 */
export const dentalEvaluationSchema = z
	.object({
		aluno_id: z.number().positive(),
		escola_id: z.number().positive().nullable(),
		profissional_id: z.number().positive().nullable(),
		usf_id: z.number().positive().nullable(),
		ano_referencia: z.number().min(2000).max(2100),
		risco: z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'G']),
		complemento: z.enum(['+', '-']).nullable(),
		classificacao_completa: z.string().max(3).nullable(),
		recebeu_atf: z.boolean(),
		precisa_art: z.boolean(),
		qtde_dentes_art: z.number().min(0).max(32),
		has_escovacao: z.boolean(),
		observacoes: z.string().nullable()
	})
	.refine(
		(data) => {
			// If precisa_art is false, qtde_dentes_art should be 0
			if (!data.precisa_art && data.qtde_dentes_art > 0) {
				return false;
			}
			return true;
		},
		{
			message: 'qtde_dentes_art must be 0 when precisa_art is false'
		}
	);

/**
 * Save or update dental evaluation for a student
 * Uses same-day check pattern from visual acuity (allows multiple evaluations per year)
 */
export async function saveDentalEvaluation(
	data: z.infer<typeof dentalEvaluationSchema>
): Promise<AvaliacaoOdontologica | null> {
	try {
		// Validate input
		const validated = dentalEvaluationSchema.parse(data);

		// Check if evaluation exists for today
		const existing = await sql<AvaliacaoOdontologica[]>`
			SELECT * FROM pse.avaliacoes_odontologicas
			WHERE aluno_id = ${validated.aluno_id}
			AND ano_referencia = ${validated.ano_referencia}
			AND avaliado_em = CURRENT_DATE
			LIMIT 1
		`;

		if (existing.length > 0) {
			const existingRecord = existing[0];

			// Check if any field has changed
			const hasChanges =
				existingRecord.risco !== validated.risco ||
				existingRecord.complemento !== validated.complemento ||
				existingRecord.classificacao_completa !== validated.classificacao_completa ||
				existingRecord.recebeu_atf !== validated.recebeu_atf ||
				existingRecord.precisa_art !== validated.precisa_art ||
				existingRecord.qtde_dentes_art !== validated.qtde_dentes_art ||
				existingRecord.has_escovacao !== validated.has_escovacao ||
				existingRecord.observacoes !== validated.observacoes;

			if (hasChanges) {
				// Update existing evaluation
				const result = await sql<AvaliacaoOdontologica[]>`
					UPDATE pse.avaliacoes_odontologicas
					SET
						risco = ${validated.risco},
						complemento = ${validated.complemento},
						classificacao_completa = ${validated.classificacao_completa},
						recebeu_atf = ${validated.recebeu_atf},
						precisa_art = ${validated.precisa_art},
						qtde_dentes_art = ${validated.qtde_dentes_art},
						has_escovacao = ${validated.has_escovacao},
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
			const result = await sql<AvaliacaoOdontologica[]>`
				INSERT INTO pse.avaliacoes_odontologicas (
					aluno_id, escola_id, profissional_id, usf_id,
					avaliado_em, ano_referencia, risco, complemento,
					classificacao_completa, recebeu_atf, precisa_art,
					qtde_dentes_art, has_escovacao, observacoes
				)
				VALUES (
					${validated.aluno_id}, ${validated.escola_id},
					${validated.profissional_id}, ${validated.usf_id},
					CURRENT_DATE, ${validated.ano_referencia},
					${validated.risco}, ${validated.complemento},
					${validated.classificacao_completa}, ${validated.recebeu_atf},
					${validated.precisa_art}, ${validated.qtde_dentes_art},
					${validated.has_escovacao}, ${validated.observacoes}
				)
				RETURNING *
			`;
			return result.length > 0 ? result[0] : null;
		}
	} catch (error) {
		console.error('saveDentalEvaluation error:', error);
		return null;
	}
}

/**
 * Get dental evaluation for a student in a specific year
 * Returns most recent evaluation if multiple exist
 */
export async function getDentalEvaluation(
	alunoId: number,
	anoReferencia: number
): Promise<AvaliacaoOdontologica | null> {
	try {
		const result = await sql<AvaliacaoOdontologica[]>`
			SELECT * FROM pse.avaliacoes_odontologicas
			WHERE aluno_id = ${alunoId}
			AND ano_referencia = ${anoReferencia}
			ORDER BY avaliado_em DESC, id DESC
			LIMIT 1
		`;

		return result.length > 0 ? result[0] : null;
	} catch (error) {
		console.error('getDentalEvaluation error:', error);
		return null;
	}
}
