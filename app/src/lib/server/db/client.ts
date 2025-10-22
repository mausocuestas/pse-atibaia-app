import postgres from 'postgres';
import { DATABASE_URL } from '$env/static/private';

if (!DATABASE_URL) {
	throw new Error('DATABASE_URL environment variable is not set');
}

/**
 * PostgreSQL client instance using Vercel's postgres library.
 * Configured for Neon PostgreSQL with SSL support.
 */
export const sql = postgres(DATABASE_URL, {
	ssl: 'require',
	max: 10,
	idle_timeout: 20,
	connect_timeout: 10
});

/**
 * Test database connection
 * @throws Error if connection fails
 */
export async function testConnection(): Promise<boolean> {
	try {
		await sql`SELECT 1`;
		return true;
	} catch (error) {
		console.error('Database connection failed:', error);
		throw new Error('Failed to connect to database');
	}
}
