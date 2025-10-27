import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAuthorizedUser } from './auth';
import type { AuthorizedUser } from './auth';

// Mock the database connection
vi.mock('$lib/server/db', () => ({
	sql: vi.fn()
}));

describe('getAuthorizedUser', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should return user data when email exists and avaliador is active', async () => {
		const { sql } = await import('$lib/server/db');
		const mockResult: AuthorizedUser[] = [
			{
				profissional_id: 1,
				avaliador_id: 10,
				usf_id: 5,
				nome_profissional: 'João Silva',
				conta_google: 'joao@example.com',
				is_gestor: false
			}
		];

		(sql as any).mockResolvedValue(mockResult);

		const result = await getAuthorizedUser('joao@example.com');

		expect(result).toEqual(mockResult[0]);
		// Verify sql was called with template literal parts and email parameter
		expect(sql).toHaveBeenCalled();
		const callArgs = (sql as any).mock.calls[0];
		expect(callArgs[0].join('')).toContain('shared.profissionais');
		expect(callArgs[1]).toBe('joao@example.com');
	});

	it('should return null when email does not exist in database', async () => {
		const { sql } = await import('$lib/server/db');
		(sql as any).mockResolvedValue([]);

		const result = await getAuthorizedUser('nonexistent@example.com');

		expect(result).toBeNull();
	});

	it('should return null when avaliador is not active', async () => {
		const { sql } = await import('$lib/server/db');
		// Empty result simulates inactive avaliador (filtered by WHERE clause)
		(sql as any).mockResolvedValue([]);

		const result = await getAuthorizedUser('inactive@example.com');

		expect(result).toBeNull();
	});

	it('should handle database errors gracefully', async () => {
		const { sql } = await import('$lib/server/db');
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		(sql as any).mockRejectedValue(new Error('Database connection failed'));

		const result = await getAuthorizedUser('test@example.com');

		expect(result).toBeNull();
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			'Error querying authorized user:',
			expect.any(Error)
		);

		consoleErrorSpy.mockRestore();
	});

	it('should validate email format and reject invalid emails', async () => {
		const { sql } = await import('$lib/server/db');
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		const result = await getAuthorizedUser('invalid-email');

		expect(result).toBeNull();
		expect(sql).not.toHaveBeenCalled(); // Database should not be queried for invalid email
		expect(consoleErrorSpy).toHaveBeenCalledWith('Invalid email format:', 'invalid-email');

		consoleErrorSpy.mockRestore();
	});
});
