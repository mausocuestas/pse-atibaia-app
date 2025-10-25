import { sql } from '$lib/server/db';
import { z } from 'zod';

/**
 * School data returned from the query
 */
export interface SchoolData {
	inep: number;
	escola: string;
	bairro: string | null;
	tipo: string | null;
	total_alunos: number;
	alunos_avaliados: number;
}

/**
 * Validation schema for usf_id input
 */
const usfIdSchema = z.number().positive();

/**
 * Fetches all active schools associated with a specific USF with enrollment and evaluation statistics
 *
 * @param usf_id - The USF identifier
 * @returns Array of schools with student count and evaluation progress or empty array on error/no results
 */
export async function getSchoolsByUsf(usf_id: number): Promise<SchoolData[]> {
	try {
		// Validate input
		const validationResult = usfIdSchema.safeParse(usf_id);
		if (!validationResult.success) {
			console.error('Invalid usf_id provided:', usf_id);
			return [];
		}

		// Get current year for filtering evaluations
		const currentYear = new Date().getFullYear();

		// Query schools linked to the USF through active relationships
		// Includes total enrolled students and count of students evaluated in current year
		const result = await sql<SchoolData[]>`
			SELECT
				e.inep,
				e.escola,
				e.bairro,
				e.tipo,
				COALESCE(COUNT(DISTINCT m.aluno_id), 0)::int AS total_alunos,
				COALESCE(COUNT(DISTINCT CASE
					WHEN (av.id IS NOT NULL OR aa.id IS NOT NULL OR ao.id IS NOT NULL)
					THEN m.aluno_id
				END), 0)::int AS alunos_avaliados
			FROM shared.escolas e
			INNER JOIN pse.usf_escolas ue ON e.inep = ue.escola_id
			LEFT JOIN pse.matriculas m ON e.inep = m.escola_id AND m.ano_letivo = ${currentYear}
			LEFT JOIN pse.avaliacoes_acuidade_visual av ON m.aluno_id = av.aluno_id
				AND av.ano_referencia = ${currentYear}
			LEFT JOIN pse.avaliacoes_antropometricas aa ON m.aluno_id = aa.aluno_id
				AND aa.ano_referencia = ${currentYear}
			LEFT JOIN pse.avaliacoes_odontologicas ao ON m.aluno_id = ao.aluno_id
				AND ao.ano_referencia = ${currentYear}
			WHERE ue.usf_id = ${usf_id}
			AND ue.is_ativo = true
			GROUP BY e.inep, e.escola, e.bairro, e.tipo
			ORDER BY e.escola ASC
		`;

		return result;
	} catch (error) {
		console.error('Error fetching schools for USF:', usf_id, error);
		return [];
	}
}
