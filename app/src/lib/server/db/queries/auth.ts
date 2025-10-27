import { sql } from '$lib/server/db';
import { z } from 'zod';

/**
 * Query to verify if a user with the given email is authorized to access the system.
 * Returns user data if email exists in profissionais.conta_google and has an active avaliador record.
 */
export interface AuthorizedUser {
	profissional_id: number;
	avaliador_id: number;
	usf_id: number;
	nome_profissional: string;
	conta_google: string;
	is_gestor: boolean;
}

const emailSchema = z.string().email();

export async function getAuthorizedUser(email: string): Promise<AuthorizedUser | null> {
	try {
		// Validate email format per coding standards (Zod validation required for all client input)
		const validationResult = emailSchema.safeParse(email);
		if (!validationResult.success) {
			console.error('Invalid email format:', email);
			return null;
		}

		const result = await sql<AuthorizedUser[]>`
			SELECT
				p.id as profissional_id,
				p.nome_profissional,
				p.conta_google,
				a.id as avaliador_id,
				a.usf_id,
				a.is_gestor
			FROM shared.profissionais p
			INNER JOIN pse.avaliadores a ON p.id = a.profissional_id
			WHERE p.conta_google = ${email}
			AND a.is_ativo = true
			LIMIT 1
		`;

		if (result.length === 0) {
			return null;
		}

		return result[0];
	} catch (error) {
		console.error('Error querying authorized user:', error);
		return null;
	}
}
