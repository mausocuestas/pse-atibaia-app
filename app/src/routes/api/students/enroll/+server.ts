import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { enrollStudentWithInfo } from '$lib/server/db/queries/enrollment';

// Validation schema for enrollment data
const enrollmentSchema = z.object({
	studentId: z.number().int().positive(),
	escolaId: z.number().int().positive(),
	turma: z.string().min(1, 'Nome da turma é obrigatório'),
	periodo: z.enum(['MANHA', 'TARDE', 'INTEGRAL', 'NOITE']),
	anoLetivo: z.number().int().min(2020).max(2030)
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
			throw error(403, 'Acesso negado. Apenas avaliadores podem matricular alunos.');
		}

		// Parse request body
		const body = await request.json();

		// Validate enrollment data
		const validationResult = enrollmentSchema.safeParse(body);
		if (!validationResult.success) {
			const fieldErrors = validationResult.error.issues.map(err => `${err.path.join('.')}: ${err.message}`);
			throw error(400, `Dados inválidos: ${fieldErrors.join(', ')}`);
		}

		const enrollmentData = validationResult.data;

		// Enroll the student
		const result = await enrollStudentWithInfo(enrollmentData);

		return json({
			success: true,
			message: 'Aluno matriculado com sucesso',
			enrollment: result.enrollment,
			student: result.student
		});
	} catch (err) {
		console.error('Student enrollment error:', err);

		// If it's already a SvelteKit error, throw it as-is
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		// Handle known error messages
		if (err instanceof Error) {
			// Don't expose internal error details in production, but log them
			if (err.message.includes('Aluno já matriculado')) {
				throw error(409, err.message); // Conflict
			}
			if (err.message.includes('Aluno não encontrado')) {
				throw error(404, err.message); // Not Found
			}
			if (err.message.includes('Erro ao')) {
				throw error(400, err.message); // Bad Request
			}
		}

		// Otherwise, return a generic server error
		throw error(500, 'Erro interno ao matricular aluno');
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
			message: 'Student enrollment API endpoint is working',
			usage: 'POST with JSON body: { studentId, escolaId, turma, periodo, anoLetivo }',
			example: {
				studentId: 123,
				escolaId: 12345678,
				turma: '1º ANO A',
				periodo: 'MANHA',
				anoLetivo: 2025
			}
		});
	} catch (err) {
		console.error('Student enrollment GET error:', err);

		// If it's already a SvelteKit error, throw it as-is
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		// Otherwise, return a generic server error
		throw error(500, 'Erro interno');
	}
};