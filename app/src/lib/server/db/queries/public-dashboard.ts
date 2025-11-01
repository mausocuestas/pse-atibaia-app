/**
 * PUBLIC DASHBOARD - Anonymized aggregate queries
 *
 * CRITICAL SECURITY REQUIREMENTS:
 * - NO student names, IDs, dates of birth, or any PII
 * - ONLY aggregated counts and percentages
 * - NO individual student records
 * - All queries must return anonymous statistical data only
 */

import { sql } from '$lib/server/db/client';

// ============================================================================
// TypeScript Interfaces for Public Dashboard Stats
// ============================================================================

export interface PublicAnthropometricStatsResult {
	classificacao: string; // CDC classification name (aggregated)
	count: number; // Number of students (anonymous count)
	percentage: number; // Percentage of total
}

export interface PublicVisualAcuityStatsResult {
	acuity_range: string; // e.g., "<=0.6", "0.61-0.9", ">=1.0"
	olho_direito: number; // Count for right eye (anonymous)
	olho_esquerdo: number; // Count for left eye (anonymous)
}

export interface PublicDentalRiskStatsResult {
	risco: string; // A-G classification (aggregated)
	count: number; // Number of students (anonymous count)
	percentage: number; // Percentage of total
}

export interface PublicEvaluationCoverageResult {
	total_students: number; // Total count (anonymous)
	anthropometric_completed: number; // Count (anonymous)
	visual_completed: number; // Count (anonymous)
	dental_completed: number; // Count (anonymous)
	anthropometric_percentage: number;
	visual_percentage: number;
	dental_percentage: number;
}

// ============================================================================
// PUBLIC Dashboard Query Functions - ANONYMIZED DATA ONLY
// ============================================================================

/**
 * PUBLIC - Get CDC classification distribution for anthropometric evaluations
 * Returns ONLY aggregated counts and percentages - NO PII
 *
 * @param anoReferencia - Optional year filter (defaults to current year)
 * @returns Array of anonymous classification statistics
 */
export async function getPublicAnthropometricStats(
	anoReferencia?: number
): Promise<PublicAnthropometricStatsResult[]> {
	try {
		const currentYear = anoReferencia || new Date().getFullYear();

		// PUBLIC QUERY - Returns ONLY aggregated data, NO student IDs or names
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
		console.error('Error fetching public anthropometric stats:', error);
		return [];
	}
}

/**
 * PUBLIC - Get visual acuity distribution grouped by ranges
 * Returns ONLY aggregated counts - NO PII
 *
 * Visual Acuity Classification:
 * - <= 0.6: Problemático (RED)
 * - 0.61-0.9: Borderline (YELLOW)
 * - >= 1.0: Normal (GREEN)
 *
 * @param anoReferencia - Optional year filter (defaults to current year)
 * @returns Array of anonymous acuity range statistics
 */
export async function getPublicVisualAcuityStats(
	anoReferencia?: number
): Promise<PublicVisualAcuityStatsResult[]> {
	try {
		const currentYear = anoReferencia || new Date().getFullYear();

		// PUBLIC QUERY - Returns ONLY aggregated counts, NO student identifiers
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
		console.error('Error fetching public visual acuity stats:', error);
		return [];
	}
}

/**
 * PUBLIC - Get dental risk classification distribution (A-G)
 * Returns ONLY aggregated counts and percentages - NO PII
 *
 * @param anoReferencia - Optional year filter (defaults to current year)
 * @returns Array of anonymous risk classification statistics
 */
export async function getPublicDentalRiskStats(
	anoReferencia?: number
): Promise<PublicDentalRiskStatsResult[]> {
	try {
		const currentYear = anoReferencia || new Date().getFullYear();

		// PUBLIC QUERY - Returns ONLY aggregated data, NO student IDs or names
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
		console.error('Error fetching public dental risk stats:', error);
		return [];
	}
}

/**
 * PUBLIC - Get evaluation coverage statistics
 * Returns ONLY aggregated percentages and counts - NO PII
 *
 * @param anoReferencia - Optional year filter (defaults to current year)
 * @returns Anonymous coverage statistics for all evaluation types
 */
export async function getPublicEvaluationCoverageStats(
	anoReferencia?: number
): Promise<PublicEvaluationCoverageResult | null> {
	try {
		const currentYear = anoReferencia || new Date().getFullYear();

		// PUBLIC QUERY - Count distinct students (anonymous count only, no IDs)
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

		// PUBLIC QUERY - Get anonymous counts for each evaluation type
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
		console.error('Error fetching public evaluation coverage stats:', error);
		return null;
	}
}
