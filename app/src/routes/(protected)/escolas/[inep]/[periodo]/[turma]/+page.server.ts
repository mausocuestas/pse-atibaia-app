import type { PageServerLoad } from './$types';
import { getStudentsByClass } from '$lib/server/db/queries/classes';
import { sql } from '$lib/server/db';
import { z } from 'zod';
import { error } from '@sveltejs/kit';

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

export const load: PageServerLoad = async ({ params, locals }) => {
	// Get authenticated session
	const session = await locals.auth();

	// Ensure user is authenticated
	if (!session?.user) {
		throw error(401, 'Não autorizado');
	}

	const escola_id = Number(params.inep);
	// Normalize periodo to uppercase to match database values (MANHÃ, TARDE, etc.)
	const periodo = params.periodo.toUpperCase();
	const turma = params.turma;

	// Check if user has evaluator or manager permissions
	const userWithPermissions = session.user as any;
	const canAddStudents = userWithPermissions.is_avaliador || userWithPermissions.is_gestor;

	// Validate escola_id
	if (!escola_id || isNaN(escola_id)) {
		return {
			escola: null,
			periodo: null,
			turma: null,
			students: [],
			user: session.user,
			canAddStudents
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
			students: [],
			user: session.user,
			canAddStudents
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
		anoLetivo: CURRENT_YEAR,
		user: session.user,
		canAddStudents
	};
};
