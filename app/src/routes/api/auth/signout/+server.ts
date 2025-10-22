import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Logout endpoint
 * Handles sign out and redirects to homepage
 */
export const POST: RequestHandler = async (event) => {
	// Auth.js handles session destruction via the auth handler
	// We just need to redirect to the signout endpoint
	throw redirect(303, '/auth/signout');
};
