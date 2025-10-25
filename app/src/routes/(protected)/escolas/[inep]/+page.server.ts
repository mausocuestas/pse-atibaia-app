import type { PageServerLoad } from './$types';
import { getPeriodsBySchool } from '$lib/server/db/queries/classes';
import { sql } from '$lib/server/db';

// Current school year - hardcoded for Story 2.2
const CURRENT_YEAR = 2025;

/**
 * School basic information
 */
interface SchoolInfo {
	inep: number;
	escola: string;
	bairro: string | null;
	tipo: string | null;
}

export const load: PageServerLoad = async ({ params }) => {
	const escola_id = Number(params.inep);

	// Validate escola_id
	if (!escola_id || isNaN(escola_id)) {
		return {
			escola: null,
			periods: []
		};
	}

	// Fetch school information
	let escola: SchoolInfo | null = null;
	try {
		const result = await sql<SchoolInfo[]>`
			SELECT inep, escola, bairro, tipo
			FROM shared.escolas
			WHERE inep = ${escola_id}
			LIMIT 1
		`;
		escola = result.length > 0 ? result[0] : null;
	} catch (error) {
		console.error('Error fetching school info:', error);
	}

	// Fetch periods for the school
	const periods = await getPeriodsBySchool(escola_id, CURRENT_YEAR);

	return {
		escola,
		periods,
		anoLetivo: CURRENT_YEAR
	};
};
