import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { sql } from '$lib/server/db/client';
import { getFilteredStudents, type ReportFilters } from '$lib/server/db/queries/reports';

/**
 * School option for filter dropdown
 */
export interface SchoolOption {
	inep: number;
	escola: string;
}

/**
 * Fetch all active schools for dropdown filter
 */
async function getActiveSchools(): Promise<SchoolOption[]> {
	try {
		const result = await sql<SchoolOption[]>`
			SELECT inep, escola
			FROM shared.escolas
			WHERE ativo = true
			ORDER BY escola ASC
		`;
		return result;
	} catch (err) {
		console.error('Error fetching schools:', err);
		return [];
	}
}

export const load: PageServerLoad = async ({ locals, url }) => {
	try {
		// Get authenticated session
		const session = await locals.auth();

		// Ensure user is authenticated
		if (!session?.user) {
			throw error(401, 'Não autorizado');
		}

		// Check if user has manager permissions
		const userWithPermissions = session.user as any;
		if (!userWithPermissions.is_gestor) {
			throw error(403, 'Acesso negado. Apenas gestores podem acessar esta página.');
		}

		// Load filter options
		const schools = await getActiveSchools();
		const currentYear = new Date().getFullYear();

		// Parse URL search params for filters
		const escolaId = url.searchParams.get('escolaId');
		const anoLetivo = url.searchParams.get('anoLetivo');
		const turma = url.searchParams.get('turma');
		const periodo = url.searchParams.get('periodo');
		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = 25;

		// Build filters object
		const filters: ReportFilters = {
			anoLetivo: anoLetivo ? parseInt(anoLetivo) : currentYear,
			limit,
			offset: (page - 1) * limit
		};

		if (escolaId) filters.escolaId = parseInt(escolaId);
		if (turma) filters.turma = turma;
		if (periodo) filters.periodo = periodo as any;

		// Get filtered results
		const { results, total } = await getFilteredStudents(filters);

		return {
			schools,
			currentYear,
			results,
			total,
			page,
			totalPages: Math.ceil(total / limit)
		};
	} catch (err) {
		console.error('Error loading reports page:', err);
		throw error(500, 'Erro ao carregar página de relatórios');
	}
};
