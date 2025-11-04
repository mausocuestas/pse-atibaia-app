import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuditLogsForStudent } from '$lib/server/db/queries/audit';

export const GET: RequestHandler = async (event) => {
	try {
		// Get authenticated session
		const session = await event.locals.auth();

		if (!session?.user) {
			throw error(401, 'Não autenticado');
		}

		// CRITICAL: Only gestores can view audit logs
		const userWithPermissions = session.user as any;
		if (!userWithPermissions.is_gestor) {
			throw error(403, 'Acesso negado - somente gestores');
		}

		// Get student ID from URL params
		const studentId = parseInt(event.params.id);
		if (isNaN(studentId) || studentId <= 0) {
			throw error(400, 'ID do aluno inválido');
		}

		// Get optional limit from query params
		const limitParam = event.url.searchParams.get('limit');
		const limit = limitParam ? parseInt(limitParam) : 50;

		if (isNaN(limit) || limit <= 0 || limit > 200) {
			throw error(400, 'Limite inválido (deve ser entre 1 e 200)');
		}

		// Get audit logs for student
		const logs = await getAuditLogsForStudent(studentId, limit);

		return json({
			success: true,
			logs
		});
	} catch (err) {
		console.error('Error in audit logs API:', err);

		// Handle known SvelteKit errors
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		// Handle other errors
		if (err instanceof Error) {
			return json(
				{
					success: false,
					error: err.message
				},
				{ status: 500 }
			);
		}

		// Unexpected error
		throw error(500, 'Erro ao buscar logs de auditoria');
	}
};
