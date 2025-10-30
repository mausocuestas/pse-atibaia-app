import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sql } from '$lib/server/db/client';

/**
 * API endpoint to fetch periods available for a specific school
 * GET /api/escolas/[inep]/periodos?anoLetivo=2025
 */
export const GET: RequestHandler = async ({ params, url, locals }) => {
	// Authentication check
	const session = await locals.auth();
	if (!session?.user) {
		return error(401, 'Não autorizado');
	}

	const escolaId = parseInt(params.inep);
	const anoLetivo = url.searchParams.get('anoLetivo');

	// Validate parameters
	if (isNaN(escolaId) || escolaId <= 0) {
		return error(400, 'ID de escola inválido');
	}

	if (!anoLetivo || isNaN(parseInt(anoLetivo))) {
		return error(400, 'Ano letivo inválido');
	}

	try {
		// Query distinct periods from enrollments for the school and year
		const periods = await sql<{ periodo: string }[]>`
			SELECT DISTINCT periodo
			FROM pse.matriculas
			WHERE escola_id = ${escolaId}
			  AND ano_letivo = ${parseInt(anoLetivo)}
			  AND periodo IS NOT NULL
			ORDER BY periodo ASC
		`;

		return json({
			periods: periods.map((p) => p.periodo)
		});
	} catch (err) {
		console.error('Error fetching periods for school:', err);
		return error(500, 'Erro ao buscar períodos');
	}
};
