import { json, type RequestHandler } from '@sveltejs/kit';
import { sql } from '$lib/server/db';

/**
 * GET /api/healthcheck
 *
 * Health check endpoint that verifies database connectivity.
 * Performs a simple SELECT NOW() query to confirm the database is accessible.
 *
 * @returns {Object} JSON response with status and timestamp
 * @returns {string} status - "ok" if healthy, "error" if not
 * @returns {string} timestamp - Current database timestamp (if successful)
 * @returns {string} message - Error message (if failed)
 */
export const GET: RequestHandler = async () => {
	try {
		// Test database connection with a simple query
		const result = await sql`SELECT NOW() as timestamp`;

		return json({
			status: 'ok',
			timestamp: result[0].timestamp,
			database: 'connected'
		});
	} catch (error) {
		console.error('Health check failed:', error);

		return json(
			{
				status: 'error',
				message: error instanceof Error ? error.message : 'Unknown database error',
				database: 'disconnected'
			},
			{ status: 503 }
		);
	}
};
