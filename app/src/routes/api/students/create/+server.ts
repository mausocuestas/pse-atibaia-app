import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { createAndEnrollStudent } from '$lib/server/db/queries/students';

// Validation schema for student creation and enrollment data
const createStudentSchema = z.object({
	// Student data
	cliente: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(255, 'Nome muito longo'),
	data_nasc: z.string().refine((dateStr) => {
		const date = new Date(dateStr);
		return !isNaN(date.getTime());
	}, 'Data de nascimento inválida'),
	sexo: z.enum(['M', 'F'], { message: 'Sexo deve ser M ou F' }),
	cpf: z.string().optional(),
	cns: z.string().max(15, 'CNS muito longo').optional(),

	// Enrollment data
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
			throw error(403, 'Acesso negado. Apenas avaliadores podem cadastrar alunos.');
		}

		// Parse request body
		const body = await request.json();

		// Validate student creation data
		const validationResult = createStudentSchema.safeParse(body);
		if (!validationResult.success) {
			const fieldErrors = validationResult.error.issues.map(
				(err) => `${err.path.join('.')}: ${err.message}`
			);
			throw error(400, `Dados inválidos: ${fieldErrors.join(', ')}`);
		}

		const data = validationResult.data;

		// Convert date string to Date object
		const dataNasc = new Date(data.data_nasc);

		// Create student and enroll in class
		const result = await createAndEnrollStudent(
			{
				cliente: data.cliente,
				data_nasc: dataNasc,
				sexo: data.sexo,
				cpf: data.cpf,
				cns: data.cns
			},
			{
				escolaId: data.escolaId,
				turma: data.turma,
				periodo: data.periodo,
				anoLetivo: data.anoLetivo
			}
		);

		return json({
			success: true,
			message: 'Aluno cadastrado e matriculado com sucesso',
			student: result.student,
			enrollment: result.enrollment
		});
	} catch (err) {
		console.error('Student creation error:', err);

		// If it's already a SvelteKit error, throw it as-is
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		// Handle known error messages
		if (err instanceof Error) {
			// CPF duplicate error
			if (err.message.includes('CPF já cadastrado')) {
				throw error(409, err.message); // Conflict
			}

			// Already enrolled error
			if (err.message.includes('Aluno já matriculado')) {
				throw error(409, err.message); // Conflict
			}

			// Validation errors
			if (
				err.message.includes('Nome deve') ||
				err.message.includes('Data de nascimento') ||
				err.message.includes('Sexo deve') ||
				err.message.includes('CPF deve') ||
				err.message.includes('CNS')
			) {
				throw error(400, err.message); // Bad Request
			}

			// Other known errors
			if (err.message.includes('Erro ao')) {
				throw error(500, err.message); // Internal Server Error
			}
		}

		// Otherwise, return a generic server error
		throw error(500, 'Erro interno ao cadastrar aluno');
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
			message: 'Student creation API endpoint is working',
			usage:
				'POST with JSON body: { cliente, data_nasc, sexo, cpf?, cns?, escolaId, turma, periodo, anoLetivo }',
			example: {
				cliente: 'João da Silva',
				data_nasc: '2015-05-15',
				sexo: 'M',
				cpf: '12345678901',
				cns: '123456789012345',
				escolaId: 12345678,
				turma: '1º ANO A',
				periodo: 'MANHA',
				anoLetivo: 2025
			}
		});
	} catch (err) {
		console.error('Student creation GET error:', err);

		// If it's already a SvelteKit error, throw it as-is
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		// Otherwise, return a generic server error
		throw error(500, 'Erro interno');
	}
};
