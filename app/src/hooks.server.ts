import { handle as authHandle } from './auth';
import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';

// Custom handle for future middleware (logging, etc.)
const customHandle: Handle = async ({ event, resolve }) => {
	return await resolve(event);
};

// Combine Auth.js handle with custom middleware
export const handle = sequence(authHandle, customHandle);
