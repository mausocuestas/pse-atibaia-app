import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { sql } from '$lib/server/db/client';

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

		// Get search and filter parameters
		const search = url.searchParams.get('search') || '';
		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = parseInt(url.searchParams.get('limit') || '20');
		const escola = url.searchParams.get('escola') || '';
		const ano = url.searchParams.get('ano') || new Date().getFullYear().toString();

		// Validate pagination parameters
		const validPage = Math.max(1, page);
		const validLimit = Math.min(100, Math.max(1, limit));
		const offset = (validPage - 1) * validLimit;

		// Build base query conditions
		const searchPattern = `%${search}%`;
		const anoInt = parseInt(ano);

		// Get total count for pagination
		let totalQuery = sql`
			SELECT COUNT(*) as total
			FROM pse.matriculas m
			INNER JOIN shared.clientes c ON m.aluno_id = c.id
			WHERE m.ano_letivo = ${anoInt}
			AND (
				c.cliente ILIKE ${searchPattern} OR
				c.data_nasc::text ILIKE ${searchPattern} OR
				c.cpf ILIKE ${searchPattern} OR
				c.ra ILIKE ${searchPattern}
			)
		`;

		// Add school filter if provided
		if (escola) {
			totalQuery = sql`
				SELECT COUNT(*) as total
				FROM pse.matriculas m
				INNER JOIN shared.clientes c ON m.aluno_id = c.id
				WHERE m.ano_letivo = ${anoInt}
				AND m.escola_id = ${escola}
				AND (
					c.cliente ILIKE ${searchPattern} OR
					c.data_nasc::text ILIKE ${searchPattern} OR
					c.cpf ILIKE ${searchPattern} OR
					c.ra ILIKE ${searchPattern}
				)
			`;
		}

		const totalResult = await totalQuery;

		const totalStudents = parseInt(totalResult[0]?.total || '0');

		// Get paginated students
		let studentsQuery = sql`
			SELECT
				c.id as aluno_id,
				c.cliente as nome_completo,
				c.data_nasc,
				c.sexo,
				c.cpf,
				c.ra,
				m.escola_id,
				e.escola as escola_nome,
				m.ano_letivo,
				m.turma,
				m.periodo,
				-- Get latest evaluation counts
				(SELECT COUNT(*) FROM pse.avaliacoes_antropometricas aa WHERE aa.aluno_id = c.id AND aa.ano_referencia = ${anoInt}) as antropometric_count,
				(SELECT COUNT(*) FROM pse.avaliacoes_acuidade_visual av WHERE av.aluno_id = c.id AND av.ano_referencia = ${anoInt}) as visual_count,
				(SELECT COUNT(*) FROM pse.avaliacoes_odontologicas ao WHERE ao.aluno_id = c.id AND ao.ano_referencia = ${anoInt}) as dental_count,
				-- Check if student has any history
				(SELECT COUNT(*) FROM (
					SELECT aluno_id FROM pse.avaliacoes_antropometricas WHERE aluno_id = c.id
					UNION
					SELECT aluno_id FROM pse.avaliacoes_acuidade_visual WHERE aluno_id = c.id
					UNION
					SELECT aluno_id FROM pse.avaliacoes_odontologicas WHERE aluno_id = c.id
				) hist) as has_history
			FROM pse.matriculas m
			INNER JOIN shared.clientes c ON m.aluno_id = c.id
			INNER JOIN shared.escolas e ON m.escola_id = e.inep
			WHERE m.ano_letivo = ${anoInt}
			AND (
				c.cliente ILIKE ${searchPattern} OR
				c.data_nasc::text ILIKE ${searchPattern} OR
				c.cpf ILIKE ${searchPattern} OR
				c.ra ILIKE ${searchPattern}
			)
			ORDER BY c.cliente
			LIMIT ${validLimit} OFFSET ${offset}
		`;

		// Add school filter if provided
		if (escola) {
			studentsQuery = sql`
				SELECT
					c.id as aluno_id,
					c.cliente as nome_completo,
					c.data_nasc,
					c.sexo,
					c.cpf,
					c.ra,
					m.escola_id,
					e.escola as escola_nome,
					m.ano_letivo,
					m.turma,
					m.periodo,
					-- Get latest evaluation counts
					(SELECT COUNT(*) FROM pse.avaliacoes_antropometricas aa WHERE aa.aluno_id = c.id AND aa.ano_referencia = ${anoInt}) as antropometric_count,
					(SELECT COUNT(*) FROM pse.avaliacoes_acuidade_visual av WHERE av.aluno_id = c.id AND av.ano_referencia = ${anoInt}) as visual_count,
					(SELECT COUNT(*) FROM pse.avaliacoes_odontologicas ao WHERE ao.aluno_id = c.id AND ao.ano_referencia = ${anoInt}) as dental_count,
					-- Check if student has any history
					(SELECT COUNT(*) FROM (
						SELECT aluno_id FROM pse.avaliacoes_antropometricas WHERE aluno_id = c.id
						UNION
						SELECT aluno_id FROM pse.avaliacoes_acuidade_visual WHERE aluno_id = c.id
						UNION
						SELECT aluno_id FROM pse.avaliacoes_odontologicas WHERE aluno_id = c.id
					) hist) as has_history
				FROM pse.matriculas m
				INNER JOIN shared.clientes c ON m.aluno_id = c.id
				INNER JOIN shared.escolas e ON m.escola_id = e.inep
				WHERE m.ano_letivo = ${anoInt}
				AND m.escola_id = ${escola}
				AND (
					c.cliente ILIKE ${searchPattern} OR
					c.data_nasc::text ILIKE ${searchPattern} OR
					c.cpf ILIKE ${searchPattern} OR
					c.ra ILIKE ${searchPattern}
				)
				ORDER BY c.cliente
				LIMIT ${validLimit} OFFSET ${offset}
			`;
		}

		const students = await studentsQuery;

		// Get available schools for filtering
		const schools = await sql`
			SELECT DISTINCT m.escola_id, e.escola
			FROM pse.matriculas m
			INNER JOIN shared.escolas e ON m.escola_id = e.inep
			WHERE m.ano_letivo = ${anoInt}
			ORDER BY e.escola
		`;

		// Get available years for filtering
		const years = await sql`
			SELECT DISTINCT ano_letivo
			FROM pse.matriculas
			ORDER BY ano_letivo DESC
		`;

		// Calculate pagination info
		const totalPages = Math.ceil(totalStudents / validLimit);

		return {
			students,
			schools,
			years,
			pagination: {
				currentPage: validPage,
				totalPages,
				totalStudents,
				limit: validLimit,
				hasNextPage: validPage < totalPages,
				hasPrevPage: validPage > 1
			},
			filters: {
				search,
				escola,
				ano
			}
		};

	} catch (err) {
		console.error('Error loading students:', err);

		// Re-throw known errors
		if (err instanceof Error && 'status' in err) {
			throw err;
		}

		// Handle unexpected errors
		throw error(500, 'Erro ao carregar lista de alunos');
	}
};