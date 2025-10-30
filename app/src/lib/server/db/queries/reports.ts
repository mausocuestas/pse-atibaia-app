import { sql } from '$lib/server/db/client';
import { z } from 'zod';

/**
 * Filtered student result with evaluation data
 */
export interface FilteredStudentResult {
	aluno_id: number;
	cliente: string;
	data_nasc: Date;
	sexo: string;
	escola_id: number;
	escola_nome: string;
	ano_letivo: number;
	turma: string;
	periodo: string;
	has_anthropometric: boolean;
	has_visual: boolean;
	has_dental: boolean;
	// Evaluation-specific fields (when filtered)
	classificacao_cdc?: string;
	olho_direito?: number;
	olho_esquerdo?: number;
	risco_dental?: string;
}

/**
 * Report filter criteria
 */
export interface ReportFilters {
	escolaId?: number;
	anoLetivo?: number;
	turma?: string;
	periodo?: 'MANHA' | 'TARDE' | 'INTEGRAL' | 'NOITE';
	evaluationTypes?: ('anthropometric' | 'visual' | 'dental')[];
	// Health status filters
	cdcClassification?: string[];
	visualAcuityRange?: string;
	dentalRisk?: string[];
	// Pagination
	limit?: number;
	offset?: number;
}

/**
 * Validation schema for report filters
 */
const reportFiltersSchema = z.object({
	escolaId: z.number().positive().optional(),
	anoLetivo: z.number().min(2020).max(2030).optional(),
	turma: z.string().min(1).max(50).optional(),
	periodo: z.enum(['MANHA', 'TARDE', 'INTEGRAL', 'NOITE']).optional(),
	evaluationTypes: z.array(z.enum(['anthropometric', 'visual', 'dental'])).optional(),
	cdcClassification: z.array(z.string()).optional(),
	visualAcuityRange: z.string().optional(),
	dentalRisk: z.array(z.string()).optional(),
	limit: z.number().min(1).max(50000).optional(), // Increased for exports
	offset: z.number().min(0).optional()
});

/**
 * Fetches filtered students with evaluation data based on multiple criteria
 *
 * @param filters - Filter criteria for students and evaluations
 * @returns Object containing results array and total count
 */
export async function getFilteredStudents(
	filters: ReportFilters = {}
): Promise<{ results: FilteredStudentResult[]; total: number }> {
	try {
		// Validate input
		const validationResult = reportFiltersSchema.safeParse(filters);
		if (!validationResult.success) {
			console.error('Invalid report filters:', validationResult.error);
			return { results: [], total: 0 };
		}

		// Set defaults
		const limit = filters.limit ?? 50;
		const offset = filters.offset ?? 0;
		const anoLetivo = filters.anoLetivo ?? new Date().getFullYear();

		// Build dynamic WHERE conditions using a simpler approach
		let additionalConditions = sql``;
		let conditionCount = 0;

		if (filters.escolaId) {
			additionalConditions = sql`${additionalConditions} AND m.escola_id = ${filters.escolaId}`;
			conditionCount++;
		}

		if (filters.turma) {
			additionalConditions = sql`${additionalConditions} AND m.turma ILIKE ${`%${filters.turma}%`}`;
			conditionCount++;
		}

		if (filters.periodo) {
			additionalConditions = sql`${additionalConditions} AND m.periodo = ${filters.periodo}`;
			conditionCount++;
		}

		// Evaluation type filters
		if (filters.evaluationTypes && filters.evaluationTypes.length > 0) {
			const hasAnthro = filters.evaluationTypes.includes('anthropometric');
			const hasVisual = filters.evaluationTypes.includes('visual');
			const hasDental = filters.evaluationTypes.includes('dental');

			if (hasAnthro && hasVisual && hasDental) {
				additionalConditions = sql`${additionalConditions} AND (aa.id IS NOT NULL OR av.id IS NOT NULL OR ao.id IS NOT NULL)`;
			} else if (hasAnthro && hasVisual) {
				additionalConditions = sql`${additionalConditions} AND (aa.id IS NOT NULL OR av.id IS NOT NULL)`;
			} else if (hasAnthro && hasDental) {
				additionalConditions = sql`${additionalConditions} AND (aa.id IS NOT NULL OR ao.id IS NOT NULL)`;
			} else if (hasVisual && hasDental) {
				additionalConditions = sql`${additionalConditions} AND (av.id IS NOT NULL OR ao.id IS NOT NULL)`;
			} else if (hasAnthro) {
				additionalConditions = sql`${additionalConditions} AND aa.id IS NOT NULL`;
			} else if (hasVisual) {
				additionalConditions = sql`${additionalConditions} AND av.id IS NOT NULL`;
			} else if (hasDental) {
				additionalConditions = sql`${additionalConditions} AND ao.id IS NOT NULL`;
			}
		}

		// Health status filters
		if (filters.cdcClassification && filters.cdcClassification.length > 0) {
			additionalConditions = sql`${additionalConditions} AND aa.classificacao_cdc IN ${sql(filters.cdcClassification)}`;
		}

		if (filters.visualAcuityRange) {
			// Ensure visual acuity evaluation exists AND has at least one eye with data
			additionalConditions = sql`${additionalConditions} AND av.id IS NOT NULL`;
			additionalConditions = sql`${additionalConditions} AND (av.olho_direito IS NOT NULL OR av.olho_esquerdo IS NOT NULL)`;

			if (filters.visualAcuityRange === '<= 0.6') {
				// At least one eye <= 0.6 (and not null)
				additionalConditions = sql`${additionalConditions} AND (
					(av.olho_direito IS NOT NULL AND av.olho_direito <= 0.6)
					OR
					(av.olho_esquerdo IS NOT NULL AND av.olho_esquerdo <= 0.6)
				)`;
			} else if (filters.visualAcuityRange === '0.61-0.9') {
				// At least one eye in range 0.61-0.9
				additionalConditions = sql`${additionalConditions} AND (
					(av.olho_direito IS NOT NULL AND av.olho_direito > 0.6 AND av.olho_direito < 1.0)
					OR
					(av.olho_esquerdo IS NOT NULL AND av.olho_esquerdo > 0.6 AND av.olho_esquerdo < 1.0)
				)`;
			} else if (filters.visualAcuityRange === '>= 1.0') {
				// At least one eye >= 1.0 (and not null)
				additionalConditions = sql`${additionalConditions} AND (
					(av.olho_direito IS NOT NULL AND av.olho_direito >= 1.0)
					OR
					(av.olho_esquerdo IS NOT NULL AND av.olho_esquerdo >= 1.0)
				)`;
			}
		}

		if (filters.dentalRisk && filters.dentalRisk.length > 0) {
			additionalConditions = sql`${additionalConditions} AND ao.risco IN ${sql(filters.dentalRisk)}`;
		}

		// Execute queries in parallel
		const [results, countResult] = await Promise.all([
			// Main query with pagination
			sql<FilteredStudentResult[]>`
				SELECT
					c.id AS aluno_id,
					c.cliente,
					c.data_nasc,
					c.sexo,
					m.escola_id,
					e.escola AS escola_nome,
					m.ano_letivo,
					m.turma,
					m.periodo,
					(aa.id IS NOT NULL) AS has_anthropometric,
					(av.id IS NOT NULL) AS has_visual,
					(ao.id IS NOT NULL) AS has_dental,
					aa.classificacao_cdc,
					av.olho_direito,
					av.olho_esquerdo,
					ao.risco AS risco_dental
				FROM pse.matriculas m
				INNER JOIN shared.clientes c ON m.aluno_id = c.id
				INNER JOIN shared.escolas e ON m.escola_id = e.inep
				LEFT JOIN pse.avaliacoes_antropometricas aa ON aa.aluno_id = c.id AND aa.ano_referencia = m.ano_letivo
				LEFT JOIN pse.avaliacoes_acuidade_visual av ON av.aluno_id = c.id AND av.ano_referencia = m.ano_letivo
				LEFT JOIN pse.avaliacoes_odontologicas ao ON ao.aluno_id = c.id AND ao.ano_referencia = m.ano_letivo
				WHERE m.ano_letivo = ${anoLetivo} ${additionalConditions}
				ORDER BY c.cliente ASC
				LIMIT ${limit}
				OFFSET ${offset}
			`,
			// Count query
			sql<{ total: number }[]>`
				SELECT COUNT(DISTINCT c.id)::int AS total
				FROM pse.matriculas m
				INNER JOIN shared.clientes c ON m.aluno_id = c.id
				INNER JOIN shared.escolas e ON m.escola_id = e.inep
				LEFT JOIN pse.avaliacoes_antropometricas aa ON aa.aluno_id = c.id AND aa.ano_referencia = m.ano_letivo
				LEFT JOIN pse.avaliacoes_acuidade_visual av ON av.aluno_id = c.id AND av.ano_referencia = m.ano_letivo
				LEFT JOIN pse.avaliacoes_odontologicas ao ON ao.aluno_id = c.id AND ao.ano_referencia = m.ano_letivo
				WHERE m.ano_letivo = ${anoLetivo} ${additionalConditions}
			`
		]);

		return {
			results,
			total: countResult[0]?.total ?? 0
		};
	} catch (error) {
		console.error('Error fetching filtered students:', error);
		return { results: [], total: 0 };
	}
}
