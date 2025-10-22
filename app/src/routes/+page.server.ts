import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.auth();

	// If user is already authenticated, redirect to dashboard
	if (session?.user) {
		throw redirect(303, '/dashboard');
	}

	return {
		session
	};
};
