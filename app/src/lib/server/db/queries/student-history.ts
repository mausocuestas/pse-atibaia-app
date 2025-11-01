/**
 * Student historical data queries
 * Provides time-series data for individual student health evaluation history
 */

import { sql } from '$lib/server/db/client';

// ============================================================================
// TypeScript Interfaces for Student Historical Data
// ============================================================================

export interface StudentAnthropometricHistory {
	id: number;
	data_avaliacao: Date;
	peso_kg: number;
	altura_cm: number;
	imc: number;
	classificacao_cdc?: string;
	ano_referencia: number;
}

export interface StudentVisualHistory {
	id: number;
	data_avaliacao: Date;
	olho_direito?: number;
	olho_esquerdo?: number;
	reteste?: number;
	ano_referencia: number;
}

export interface StudentDentalHistory {
	id: number;
	data_avaliacao: Date;
	risco?: string;
	atf_realizado: boolean;
	necessita_art: boolean;
	art_quantidade_dentes?: number;
	escovacao_orientada_realizada: boolean;
	ano_referencia: number;
}

export interface StudentInfo {
	id: number;
	nome_completo: string;
	data_nascimento: Date;
	sexo: 'Masculino' | 'Feminino';
	escola_id: number;
	escola_nome: string;
	ano_letivo: number;
	turma?: string;
	periodo?: string;
}

// ============================================================================
// Student Historical Data Query Functions
// ============================================================================

/**
 * Get student basic information with current enrollment details
 * @param alunoId - Student ID to fetch information for
 * @returns Student basic and enrollment information or null if not found
 */
export async function getStudentInfo(alunoId: number): Promise<StudentInfo | null> {
	try {
		const result = await sql<StudentInfo[]>`
			SELECT
				c.id,
				c.cliente as nome_completo,
				c.data_nasc as data_nascimento,
				c.sexo,
				m.escola_id,
				e.escola as escola_nome,
				m.ano_letivo,
				m.turma,
				m.periodo
			FROM pse.matriculas m
			INNER JOIN shared.clientes c ON m.aluno_id = c.id
			INNER JOIN shared.escolas e ON m.escola_id = e.inep
			WHERE m.aluno_id = ${alunoId}
			ORDER BY m.ano_letivo DESC
			LIMIT 1
		`;

		return result[0] || null;
	} catch (error) {
		console.error('Error fetching student info:', error);
		return null;
	}
}

/**
 * Get anthropometric evaluation history for a specific student
 * Returns all anthropometric evaluations ordered by date for time-series visualization
 *
 * @param alunoId - Student ID to fetch history for
 * @returns Array of anthropometric evaluations ordered by date
 */
export async function getStudentAnthropometricHistory(
	alunoId: number
): Promise<StudentAnthropometricHistory[]> {
	try {
		const results = await sql<StudentAnthropometricHistory[]>`
			SELECT
				id,
				avaliado_em as data_avaliacao,
				peso_kg,
				altura_cm,
				imc,
				classificacao_cdc,
				ano_referencia
			FROM pse.avaliacoes_antropometricas
			WHERE aluno_id = ${alunoId}
				AND peso_kg IS NOT NULL
				AND altura_cm IS NOT NULL
			ORDER BY avaliado_em ASC
		`;

		return results;
	} catch (error) {
		console.error('Error fetching anthropometric history:', error);
		return [];
	}
}

/**
 * Get visual acuity evaluation history for a specific student
 * Returns all visual acuity evaluations ordered by date for time-series visualization
 *
 * @param alunoId - Student ID to fetch history for
 * @returns Array of visual acuity evaluations ordered by date
 */
export async function getStudentVisualHistory(
	alunoId: number
): Promise<StudentVisualHistory[]> {
	try {
		const results = await sql<StudentVisualHistory[]>`
			SELECT
				id,
				avaliado_em as data_avaliacao,
				olho_direito,
				olho_esquerdo,
				olho_direito_reteste as reteste,
				ano_referencia
			FROM pse.avaliacoes_acuidade_visual
			WHERE aluno_id = ${alunoId}
				AND (olho_direito IS NOT NULL OR olho_esquerdo IS NOT NULL)
			ORDER BY avaliado_em ASC
		`;

		return results;
	} catch (error) {
		console.error('Error fetching visual history:', error);
		return [];
	}
}

/**
 * Get dental evaluation history for a specific student
 * Returns all dental evaluations ordered by date for time-series visualization
 *
 * @param alunoId - Student ID to fetch history for
 * @returns Array of dental evaluations ordered by date
 */
export async function getStudentDentalHistory(
	alunoId: number
): Promise<StudentDentalHistory[]> {
	try {
		const results = await sql<StudentDentalHistory[]>`
			SELECT
				id,
				avaliado_em as data_avaliacao,
				risco,
				recebeu_atf as atf_realizado,
				precisa_art as necessita_art,
				qtde_dentes_art as art_quantidade_dentes,
				has_escovacao as escovacao_orientada_realizada,
				ano_referencia
			FROM pse.avaliacoes_odontologicas
			WHERE aluno_id = ${alunoId}
			ORDER BY avaliado_em ASC
		`;

		return results;
	} catch (error) {
		console.error('Error fetching dental history:', error);
		return [];
	}
}

/**
 * Get complete student historical data for all evaluation types
 * Convenience function that fetches all historical data in parallel
 *
 * @param alunoId - Student ID to fetch complete history for
 * @returns Object containing all historical data types and student info
 */
export async function getStudentCompleteHistory(alunoId: number) {
	try {
		const [studentInfo, anthropometricHistory, visualHistory, dentalHistory] =
			await Promise.all([
				getStudentInfo(alunoId),
				getStudentAnthropometricHistory(alunoId),
				getStudentVisualHistory(alunoId),
				getStudentDentalHistory(alunoId)
			]);

		return {
			studentInfo,
			anthropometricHistory,
			visualHistory,
			dentalHistory
		};
	} catch (error) {
		console.error('Error fetching student complete history:', error);
		return {
			studentInfo: null,
			anthropometricHistory: [],
			visualHistory: [],
			dentalHistory: []
		};
	}
}

/**
 * Get available years for a student's evaluations
 * Used for year filtering and chart navigation
 *
 * @param alunoId - Student ID to fetch available years for
 * @returns Array of years in which the student had evaluations
 */
export async function getStudentAvailableYears(alunoId: number): Promise<number[]> {
	try {
		const results = await sql<{ ano: string }[]>`
			SELECT DISTINCT ano_referencia as ano
			FROM (
				SELECT ano_referencia FROM pse.avaliacoes_antropometricas WHERE aluno_id = ${alunoId}
				UNION
				SELECT ano_referencia FROM pse.avaliacoes_acuidade_visual WHERE aluno_id = ${alunoId}
				UNION
				SELECT ano_referencia FROM pse.avaliacoes_odontologicas WHERE aluno_id = ${alunoId}
			) available_years
			ORDER BY ano DESC
		`;

		return results.map(row => Number(row.ano));
	} catch (error) {
		console.error('Error fetching student available years:', error);
		return [];
	}
}