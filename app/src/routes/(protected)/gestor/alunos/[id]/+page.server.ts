import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getStudentCompleteHistory } from '$lib/server/db/queries/student-history';

export const load: PageServerLoad = async ({ params, locals }) => {
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

		// Parse and validate student ID
		const alunoId = Number(params.id);
		if (isNaN(alunoId) || alunoId <= 0) {
			throw error(400, 'ID de aluno inválido');
		}

		// Fetch complete student historical data
		const studentData = await getStudentCompleteHistory(alunoId);

		// Verify student exists
		if (!studentData.studentInfo) {
			throw error(404, 'Aluno não encontrado');
		}

		return {
			studentData
		};
	} catch (err) {
		console.error('Error loading student history data:', err);

		// Re-throw known errors (HttpError from SvelteKit)
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		// Handle unexpected errors
		throw error(500, 'Erro ao carregar dados do aluno');
	}
};