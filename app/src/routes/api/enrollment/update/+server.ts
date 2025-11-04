import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { updateEnrollmentWithAudit } from '$lib/server/db/queries/audit';

// Validation schema for enrollment update
const EnrollmentUpdateSchema = z.object({
	enrollmentId: z.number().positive('ID da matrícula deve ser positivo'),
	escolaId: z.number().positive('ID da escola deve ser positivo'),
	turma: z.string().min(1, 'Turma é obrigatória').max(100, 'Turma muito longa'),
	periodo: z.enum(['Manhã', 'Tarde', 'Integral', 'Noite']),
	anoLetivo: z
		.number()
		.min(2020, 'Ano letivo deve ser maior que 2020')
		.max(2030, 'Ano letivo deve ser menor que 2030'),
	observacoes: z.string().max(500, 'Observações muito longas').optional().nullable()
});

export const POST: RequestHandler = async (event) => {
	try {
		// CSRF Protection: Verify request origin
		// This prevents Cross-Site Request Forgery attacks by ensuring requests
		// originate from the same site (not from malicious external websites)
		const origin = event.request.headers.get('origin');
		const host = event.request.headers.get('host');

		// For sub-requests (internal SvelteKit requests), origin may be null
		if (!event.isSubRequest) {
			if (!origin) {
				throw error(403, 'Requisição bloqueada - origem ausente (possível ataque CSRF)');
			}

			// Verify origin matches host (same-origin policy)
			const originUrl = new URL(origin);
			if (originUrl.host !== host) {
				throw error(
					403,
					`Requisição bloqueada - origem não autorizada (possível ataque CSRF): ${originUrl.host} !== ${host}`
				);
			}
		}

		// Get authenticated session
		const session = await event.locals.auth();

		if (!session?.user) {
			throw error(401, 'Não autenticado');
		}

		// CRITICAL: Only gestores can update enrollments
		const userWithPermissions = session.user as any;
		if (!userWithPermissions.is_gestor) {
			throw error(403, 'Acesso negado - somente gestores');
		}

		// Get profissional ID from session
		const profissionalId = userWithPermissions.id;
		if (!profissionalId) {
			throw error(400, 'ID do profissional não encontrado na sessão');
		}

		// Parse request body
		const body = await event.request.json();

		// Validate request body
		const validationResult = EnrollmentUpdateSchema.safeParse(body);
		if (!validationResult.success) {
			const errorMessage = validationResult.error.errors
				.map((err) => `${err.path.join('.')}: ${err.message}`)
				.join(', ');
			throw error(400, `Dados inválidos: ${errorMessage}`);
		}

		const updateData = validationResult.data;

		// Get IP address and user agent for audit trail
		const ipAddress = event.getClientAddress();
		const userAgent = event.request.headers.get('user-agent') || undefined;

		// Update enrollment with audit logging
		const result = await updateEnrollmentWithAudit(
			updateData,
			profissionalId,
			ipAddress,
			userAgent
		);

		// Return success response
		return json({
			success: true,
			enrollment: result.enrollment,
			auditLogId: result.auditLogId
		});
	} catch (err) {
		console.error('Error in enrollment update API:', err);

		// Handle known SvelteKit errors
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		// Handle validation and business logic errors
		if (err instanceof Error) {
			// Check for specific error messages and map to appropriate status codes
			if (err.message.includes('não encontrada')) {
				throw error(404, err.message);
			}
			if (err.message.includes('já matriculado')) {
				throw error(409, err.message);
			}
			if (err.message.includes('inativa')) {
				throw error(400, err.message);
			}

			// Return error message to client
			return json(
				{
					success: false,
					error: err.message
				},
				{ status: 400 }
			);
		}

		// Unexpected error
		throw error(500, 'Erro ao atualizar matrícula');
	}
};
