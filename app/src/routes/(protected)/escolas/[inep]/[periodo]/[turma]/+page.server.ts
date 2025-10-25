import type { PageServerLoad } from './$types';
import { getStudentsByClass } from '$lib/server/db/queries/classes';
import { sql } from '$lib/server/db';
import { z } from 'zod';

// Current school year - hardcoded for Story 2.2
const CURRENT_YEAR = 2025;

/**
 * Validation schema for periodo parameter
 * Values stored in DB without accents: MANHA, TARDE, INTEGRAL, NOITE
 */
const periodoSchema = z.enum(['MANHA', 'TARDE', 'INTEGRAL', 'NOITE']);

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
	// Normalize periodo to uppercase to match database values (MANHÃ, TARDE, etc.)
	const periodo = params.periodo.toUpperCase();
	const turma = params.turma;

	// Validate escola_id
	if (!escola_id || isNaN(escola_id)) {
		return {
			escola: null,
			periodo: null,
			turma: null,
			students: []
		};
	}

	// Validate periodo
	const periodoValidation = periodoSchema.safeParse(periodo);
	if (!periodoValidation.success) {
		console.error('Invalid periodo:', periodo);
		return {
			escola: null,
			periodo: null,
			turma: null,
			students: []
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

	// Fetch students for the class
	const students = await getStudentsByClass(escola_id, periodo, turma, CURRENT_YEAR);

	return {
		escola,
		periodo,
		turma,
		students,
		anoLetivo: CURRENT_YEAR
	};
};
