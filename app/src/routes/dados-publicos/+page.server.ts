/**
 * PUBLIC DASHBOARD - Server-side data loading
 *
 * CRITICAL SECURITY: This page is PUBLIC and requires NO authentication
 * Returns ONLY anonymized, aggregated data - NO PII
 */

import type { PageServerLoad } from './$types';
import {
	getPublicAnthropometricStats,
	getPublicVisualAcuityStats,
	getPublicDentalRiskStats,
	getPublicEvaluationCoverageStats
} from '$lib/server/db/queries/public-dashboard';

export const load: PageServerLoad = async ({ url }) => {
	try {
		// NO AUTHENTICATION REQUIRED - This is a public page
		// NO session check, NO user validation

		// Get year parameter from URL or default to current year
		const urlYear = url.searchParams.get('ano');
		const selectedYear = urlYear ? parseInt(urlYear) : new Date().getFullYear();

		// Validate year is reasonable (prevent SQL injection via year param)
		const currentYear = new Date().getFullYear();
		const minYear = currentYear - 10;
		const maxYear = currentYear + 1;

		// If invalid year, use current year as fallback (public page should be resilient)
		const validYear =
			!isNaN(selectedYear) && selectedYear >= minYear && selectedYear <= maxYear
				? selectedYear
				: currentYear;

		// Fetch all PUBLIC dashboard metrics in parallel
		// All functions return ONLY anonymized, aggregated data
		const [anthropometricStats, visualAcuityStats, dentalRiskStats, coverageStats] =
			await Promise.all([
				getPublicAnthropometricStats(validYear),
				getPublicVisualAcuityStats(validYear),
				getPublicDentalRiskStats(validYear),
				getPublicEvaluationCoverageStats(validYear)
			]);

		return {
			anthropometricStats,
			visualAcuityStats,
			dentalRiskStats,
			coverageStats,
			currentYear: validYear,
			availableYears: Array.from({ length: currentYear - minYear + 1 }, (_, i) => currentYear - i)
		};
	} catch (err) {
		console.error('Error loading public dashboard data:', err);

		// Return empty data on error (public page should degrade gracefully)
		const currentYear = new Date().getFullYear();
		return {
			anthropometricStats: [],
			visualAcuityStats: [],
			dentalRiskStats: [],
			coverageStats: null,
			currentYear,
			availableYears: [currentYear]
		};
	}
};
