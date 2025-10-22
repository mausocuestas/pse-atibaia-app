import type { Session } from '@auth/core/types';

/**
 * Type guard to check if a session exists and has required user data.
 */
export function isAuthenticated(session: Session | null): session is Session {
	return session !== null && session.user !== undefined;
}

/**
 * Helper to get session from event.locals
 * Use this in load functions: const session = await getServerSession(event);
 */
export async function getServerSession(event: { locals: { auth: () => Promise<Session | null> } }) {
	return await event.locals.auth();
}
