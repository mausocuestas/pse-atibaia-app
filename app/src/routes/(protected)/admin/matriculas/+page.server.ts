import type { PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { sql } from '$lib/server/db/client';

export const load: PageServerLoad = async ({ locals, url }) => {
	try {
		// Get authenticated session
		const session = await locals.auth();

		// Ensure user is authenticated
		if (!session?.user) {
			throw redirect(302, '/auth/login');
		}

		// CRITICAL: Only gestores can access enrollment management
		const userWithPermissions = session.user as any;
		if (!userWithPermissions.is_gestor) {
			throw redirect(302, '/dashboard');
		}

		// Get search and filter parameters
		const search = url.searchParams.get('nome') || '';
		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = parseInt(url.searchParams.get('limit') || '20');
		const escolaFilter = url.searchParams.get('escola') || '';
		const anoFilter = url.searchParams.get('ano') || new Date().getFullYear().toString();
		const turmaFilter = url.searchParams.get('turma') || '';

		// Validate pagination parameters
		const validPage = Math.max(1, page);
		const validLimit = Math.min(100, Math.max(1, limit));
		const offset = (validPage - 1) * validLimit;

		// Build base query conditions
		const searchPattern = `%${search}%`;
		const anoInt = parseInt(anoFilter);

		// Build WHERE conditions dynamically
		let whereConditions = sql`m.ano_letivo = ${anoInt}`;

		if (search) {
			whereConditions = sql`${whereConditions} AND c.cliente ILIKE ${searchPattern}`;
		}

		if (escolaFilter) {
			const escolaInt = parseInt(escolaFilter);
			whereConditions = sql`${whereConditions} AND m.escola_id = ${escolaInt}`;
		}

		if (turmaFilter) {
			const turmaPattern = `%${turmaFilter}%`;
			whereConditions = sql`${whereConditions} AND m.turma ILIKE ${turmaPattern}`;
		}

		// Get total count for pagination
		const totalResult = await sql`
			SELECT COUNT(DISTINCT m.id) as total
			FROM pse.matriculas m
			INNER JOIN shared.clientes c ON m.aluno_id = c.id
			WHERE ${whereConditions}
		`;

		const totalEnrollments = parseInt(totalResult[0]?.total || '0');

		// Get paginated enrollment records
		const enrollments = await sql`
			SELECT
				m.id as enrollment_id,
				c.id as aluno_id,
				c.cliente as nome_completo,
				c.data_nasc,
				m.escola_id,
				e.escola as escola_nome,
				m.turma,
				m.periodo,
				m.ano_letivo,
				m.observacoes
			FROM pse.matriculas m
			INNER JOIN shared.clientes c ON m.aluno_id = c.id
			INNER JOIN shared.escolas e ON m.escola_id = e.inep
			WHERE ${whereConditions}
			ORDER BY c.cliente
			LIMIT ${validLimit} OFFSET ${offset}
		`;

		// Get available schools for filtering
		const schools = await sql`
			SELECT DISTINCT e.inep as escola_id, e.escola
			FROM shared.escolas e
			INNER JOIN pse.matriculas m ON e.inep = m.escola_id
			WHERE e.ativo = 'S'
			ORDER BY e.escola
		`;

		// Get available years for filtering
		const years = await sql`
			SELECT DISTINCT ano_letivo
			FROM pse.matriculas
			ORDER BY ano_letivo DESC
			LIMIT 10
		`;

		// Calculate pagination info
		const totalPages = Math.ceil(totalEnrollments / validLimit);

		return {
			enrollments,
			schools,
			years,
			pagination: {
				currentPage: validPage,
				totalPages,
				totalEnrollments,
				limit: validLimit,
				hasNextPage: validPage < totalPages,
				hasPrevPage: validPage > 1
			},
			filters: {
				nome: search,
				escola: escolaFilter,
				ano: anoFilter,
				turma: turmaFilter
			}
		};
	} catch (err) {
		console.error('Error loading enrollment management:', err);

		// Re-throw known errors (redirect, etc.)
		if (err instanceof Error && 'status' in err) {
			throw err;
		}

		// Handle unexpected errors
		throw error(500, 'Erro ao carregar gerenciamento de matrículas');
	}
};
