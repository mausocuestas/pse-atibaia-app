/**
 * Dashboard aggregate queries for manager view
 * Provides statistical data for charts and metrics
 */

import { sql } from '$lib/server/db/client';

// ============================================================================
// TypeScript Interfaces for Dashboard Stats
// ============================================================================

export interface AnthropometricStatsResult {
	classificacao: string; // CDC classification name
	count: number; // Number of students
	percentage: number; // Percentage of total (calculated)
}

export interface VisualAcuityStatsResult {
	acuity_range: string; // e.g., "<=0.6", "0.61-0.9", ">=1.0"
	olho_direito: number; // Count for right eye
	olho_esquerdo: number; // Count for left eye
}

export interface DentalRiskStatsResult {
	risco: string; // A-G classification
	count: number;
	percentage: number;
}

export interface EvaluationCoverageResult {
	total_students: number;
	anthropometric_completed: number;
	visual_completed: number;
	dental_completed: number;
	anthropometric_percentage: number;
	visual_percentage: number;
	dental_percentage: number;
}

// ============================================================================
// Dashboard Query Functions
// ============================================================================

/**
 * Get CDC classification distribution for anthropometric evaluations
 * Returns count and percentage for each classification category
 *
 * @param anoReferencia - Optional year filter (defaults to current year)
 * @returns Array of classification statistics
 */
export async function getAnthropometricStats(
	anoReferencia?: number
): Promise<AnthropometricStatsResult[]> {
	try {
		const currentYear = anoReferencia || new Date().getFullYear();

		const results = await sql<{ classificacao_cdc: string; count: string }[]>`
			SELECT
				classificacao_cdc,
				COUNT(*) as count
			FROM pse.avaliacoes_antropometricas
			WHERE ano_referencia = ${currentYear}
				AND classificacao_cdc IS NOT NULL
			GROUP BY classificacao_cdc
			ORDER BY classificacao_cdc
		`;

		// Calculate total for percentage
		const total = results.reduce((sum, row) => sum + Number(row.count), 0);

		// Transform results and calculate percentages
		return results.map((row) => ({
			classificacao: row.classificacao_cdc,
			count: Number(row.count),
			percentage: total > 0 ? (Number(row.count) / total) * 100 : 0
		}));
	} catch (error) {
		console.error('Error fetching anthropometric stats:', error);
		return [];
	}
}

/**
 * Get visual acuity distribution grouped by ranges
 * Focuses on problematic values (<= 0.6) per Dev Notes requirement
 *
 * CRITICAL - Visual Acuity Classification:
 * - <= 0.6: Problemático (RED) - Priority for intervention
 * - 0.61-0.9: Borderline (YELLOW) - Monitor
 * - >= 1.0: Normal (GREEN) - No action needed
 *
 * @param anoReferencia - Optional year filter (defaults to current year)
 * @returns Array of acuity range statistics for both eyes
 */
export async function getVisualAcuityStats(
	anoReferencia?: number
): Promise<VisualAcuityStatsResult[]> {
	try {
		const currentYear = anoReferencia || new Date().getFullYear();

		const results = await sql<
			{
				acuity_range: string;
				olho_direito: string;
				olho_esquerdo: string;
			}[]
		>`
			WITH visual_data AS (
				SELECT
					olho_direito,
					olho_esquerdo
				FROM pse.avaliacoes_acuidade_visual
				WHERE ano_referencia = ${currentYear}
					AND (olho_direito IS NOT NULL OR olho_esquerdo IS NOT NULL)
			)
			SELECT
				'<= 0.6' as acuity_range,
				COUNT(CASE WHEN olho_direito <= 0.6 THEN 1 END) as olho_direito,
				COUNT(CASE WHEN olho_esquerdo <= 0.6 THEN 1 END) as olho_esquerdo
			FROM visual_data
			UNION ALL
			SELECT
				'0.61-0.9' as acuity_range,
				COUNT(CASE WHEN olho_direito > 0.6 AND olho_direito < 1.0 THEN 1 END) as olho_direito,
				COUNT(CASE WHEN olho_esquerdo > 0.6 AND olho_esquerdo < 1.0 THEN 1 END) as olho_esquerdo
			FROM visual_data
			UNION ALL
			SELECT
				'>= 1.0' as acuity_range,
				COUNT(CASE WHEN olho_direito >= 1.0 THEN 1 END) as olho_direito,
				COUNT(CASE WHEN olho_esquerdo >= 1.0 THEN 1 END) as olho_esquerdo
			FROM visual_data
			ORDER BY acuity_range DESC
		`;

		return results.map((row) => ({
			acuity_range: row.acuity_range,
			olho_direito: Number(row.olho_direito),
			olho_esquerdo: Number(row.olho_esquerdo)
		}));
	} catch (error) {
		console.error('Error fetching visual acuity stats:', error);
		return [];
	}
}

/**
 * Get dental risk classification distribution (A-G)
 * Returns count and percentage for each risk level
 *
 * @param anoReferencia - Optional year filter (defaults to current year)
 * @returns Array of risk classification statistics
 */
export async function getDentalRiskStats(
	anoReferencia?: number
): Promise<DentalRiskStatsResult[]> {
	try {
		const currentYear = anoReferencia || new Date().getFullYear();

		const results = await sql<{ risco: string; count: string }[]>`
			SELECT
				risco,
				COUNT(*) as count
			FROM pse.avaliacoes_odontologicas
			WHERE ano_referencia = ${currentYear}
				AND risco IS NOT NULL
			GROUP BY risco
			ORDER BY risco
		`;

		// Calculate total for percentage
		const total = results.reduce((sum, row) => sum + Number(row.count), 0);

		// Transform results and calculate percentages
		return results.map((row) => ({
			risco: row.risco,
			count: Number(row.count),
			percentage: total > 0 ? (Number(row.count) / total) * 100 : 0
		}));
	} catch (error) {
		console.error('Error fetching dental risk stats:', error);
		return [];
	}
}

/**
 * Get evaluation coverage statistics
 * Calculates percentage of students with each type of evaluation
 *
 * @param anoReferencia - Optional year filter (defaults to current year)
 * @returns Coverage statistics for all evaluation types
 */
export async function getEvaluationCoverageStats(
	anoReferencia?: number
): Promise<EvaluationCoverageResult | null> {
	try {
		const currentYear = anoReferencia || new Date().getFullYear();

		// Get total unique students evaluated in any way this year
		const totalResult = await sql<{ total: string }[]>`
			SELECT COUNT(DISTINCT aluno_id) as total
			FROM (
				SELECT aluno_id FROM pse.avaliacoes_antropometricas WHERE ano_referencia = ${currentYear}
				UNION
				SELECT aluno_id FROM pse.avaliacoes_acuidade_visual WHERE ano_referencia = ${currentYear}
				UNION
				SELECT aluno_id FROM pse.avaliacoes_odontologicas WHERE ano_referencia = ${currentYear}
			) all_evaluated
		`;

		const total = Number(totalResult[0]?.total || 0);

		if (total === 0) {
			return {
				total_students: 0,
				anthropometric_completed: 0,
				visual_completed: 0,
				dental_completed: 0,
				anthropometric_percentage: 0,
				visual_percentage: 0,
				dental_percentage: 0
			};
		}

		// Get counts for each evaluation type
		const countsResult = await sql<
			{
				anthropometric: string;
				visual: string;
				dental: string;
			}[]
		>`
			SELECT
				(SELECT COUNT(DISTINCT aluno_id) FROM pse.avaliacoes_antropometricas WHERE ano_referencia = ${currentYear}) as anthropometric,
				(SELECT COUNT(DISTINCT aluno_id) FROM pse.avaliacoes_acuidade_visual WHERE ano_referencia = ${currentYear}) as visual,
				(SELECT COUNT(DISTINCT aluno_id) FROM pse.avaliacoes_odontologicas WHERE ano_referencia = ${currentYear}) as dental
		`;

		const counts = countsResult[0];
		const anthropometric = Number(counts.anthropometric);
		const visual = Number(counts.visual);
		const dental = Number(counts.dental);

		return {
			total_students: total,
			anthropometric_completed: anthropometric,
			visual_completed: visual,
			dental_completed: dental,
			anthropometric_percentage: (anthropometric / total) * 100,
			visual_percentage: (visual / total) * 100,
			dental_percentage: (dental / total) * 100
		};
	} catch (error) {
		console.error('Error fetching evaluation coverage stats:', error);
		return null;
	}
}
