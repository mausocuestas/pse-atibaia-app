import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.auth();

	if (!session || !session.user) {
		throw redirect(303, '/');
	}

	const user = session.user as any;

	return {
		user: {
			name: user.name,
			email: user.email,
			nome_profissional: user.nome_profissional,
			avaliador_id: user.avaliador_id,
			usf_id: user.usf_id,
			profissional_id: user.profissional_id
		}
	};
};
