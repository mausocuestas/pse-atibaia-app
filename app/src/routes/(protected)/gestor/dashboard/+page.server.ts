import type { PageServerLoad } from './$types';
import {
	getAnthropometricStats,
	getVisualAcuityStats,
	getDentalRiskStats,
	getEvaluationCoverageStats
} from '$lib/server/db/queries/dashboard';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
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

		// Fetch all dashboard metrics in parallel for better performance
		const currentYear = new Date().getFullYear();

		const [anthropometricStats, visualAcuityStats, dentalRiskStats, coverageStats] =
			await Promise.all([
				getAnthropometricStats(currentYear),
				getVisualAcuityStats(currentYear),
				getDentalRiskStats(currentYear),
				getEvaluationCoverageStats(currentYear)
			]);

		return {
			anthropometricStats,
			visualAcuityStats,
			dentalRiskStats,
			coverageStats,
			currentYear
		};
	} catch (err) {
		console.error('Error loading dashboard data:', err);
		throw error(500, 'Erro ao carregar dados do dashboard');
	}
};
