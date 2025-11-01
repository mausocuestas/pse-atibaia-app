import type { PageServerLoad } from './$types';
import {
	getAnthropometricStats,
	getVisualAcuityStats,
	getDentalRiskStats,
	getEvaluationCoverageStats
} from '$lib/server/db/queries/dashboard';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
	try {
		// Get authenticated session
		const session = await locals.auth();

		// Ensure user is authenticated
		if (!session?.user) {
			throw error(401, 'Não autorizado');
		}

		// Check if user has manager permissions
		const userWithPermissions = session.user as any;
		if (!userWithPermissions.is_gestor) {
			throw error(403, 'Acesso negado. Apenas gestores podem acessar esta página.');
		}

		// Get year parameter from URL or default to current year
		const urlYear = url.searchParams.get('ano');
		const selectedYear = urlYear ? parseInt(urlYear) : new Date().getFullYear();

		// Validate year is reasonable
		const currentYear = new Date().getFullYear();
		const minYear = currentYear - 10;
		const maxYear = currentYear + 1;

		if (isNaN(selectedYear) || selectedYear < minYear || selectedYear > maxYear) {
			throw error(400, 'Ano inválido');
		}

		// Fetch all dashboard metrics in parallel for better performance
		const [anthropometricStats, visualAcuityStats, dentalRiskStats, coverageStats] =
			await Promise.all([
				getAnthropometricStats(selectedYear),
				getVisualAcuityStats(selectedYear),
				getDentalRiskStats(selectedYear),
				getEvaluationCoverageStats(selectedYear)
			]);

		return {
			anthropometricStats,
			visualAcuityStats,
			dentalRiskStats,
			coverageStats,
			currentYear: selectedYear,
			availableYears: Array.from({ length: currentYear - minYear + 1 }, (_, i) => currentYear - i)
		};
	} catch (err) {
		console.error('Error loading dashboard data:', err);

		// Re-throw known errors (HttpError from SvelteKit)
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		// Handle unexpected errors
		throw error(500, 'Erro ao carregar dados do dashboard');
	}
};
