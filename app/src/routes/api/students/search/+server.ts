import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { searchStudentsWithEnrollments } from '$lib/server/db/queries/student-search';

// Validation schema for search criteria
const searchCriteriaSchema = z.object({
	nome: z.string().optional(),
	dataNascimento: z.string().optional(),
	cpf: z.string().optional()
});

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		// Get authenticated session
		const session = await locals.auth();

		// Ensure user is authenticated
		if (!session?.user) {
			throw error(401, 'Não autorizado');
		}

		// Check if user has evaluator or manager permissions
		const userWithPermissions = session.user as any;
		if (!userWithPermissions.is_avaliador && !userWithPermissions.is_gestor) {
			throw error(403, 'Acesso negado. Apenas avaliadores podem buscar alunos.');
		}

		// Parse request body
		const body = await request.json();

		// Validate search criteria
		const validationResult = searchCriteriaSchema.safeParse(body);
		if (!validationResult.success) {
			throw error(400, 'Critérios de busca inválidos');
		}

		const criteria = validationResult.data;

		// Ensure at least one search criteria is provided
		if (!criteria.nome && !criteria.dataNascimento && !criteria.cpf) {
			throw error(400, 'Pelo menos um critério de busca deve ser informado');
		}

		// Search for students
		const results = await searchStudentsWithEnrollments(criteria);

		return json(results);
	} catch (err) {
		console.error('Student search error:', err);

		// If it's already a SvelteKit error, throw it as-is
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		// Otherwise, return a generic server error
		throw error(500, 'Erro interno ao buscar alunos');
	}
};

// GET method for testing (optional)
export const GET: RequestHandler = async ({ locals }) => {
	try {
		// Get authenticated session
		const session = await locals.auth();

		// Ensure user is authenticated
		if (!session?.user) {
			throw error(401, 'Não autorizado');
		}

		// Check if user has evaluator or manager permissions
		const userWithPermissions = session.user as any;
		if (!userWithPermissions.is_avaliador && !userWithPermissions.is_gestor) {
			throw error(403, 'Acesso negado');
		}

		return json({
			message: 'Student search API endpoint is working',
			usage: 'POST with JSON body: { nome?, dataNascimento?, cpf? }'
		});
	} catch (err) {
		console.error('Student search GET error:', err);

		// If it's already a SvelteKit error, throw it as-is
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		// Otherwise, return a generic server error
		throw error(500, 'Erro interno');
	}
};