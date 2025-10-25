import { sql } from '$lib/server/db';
import { z } from 'zod';

/**
 * Period data returned from the query
 */
export interface PeriodData {
	periodo: string;
}

/**
 * Class data returned from the query
 */
export interface ClassData {
	turma: string;
	total_alunos: number;
}

/**
 * Student data returned from the query
 */
export interface StudentData {
	aluno_id: number;
	nome: string;
	data_nasc: Date | null;
	idade: number | null;
	has_visual_eval: boolean;
	has_anthropometric_eval: boolean;
	has_dental_eval: boolean;
}

/**
 * Validation schema for escola_id and ano_letivo
 */
const schoolYearSchema = z.object({
	escola_id: z.number().positive(),
	ano_letivo: z.number().min(2000).max(2100)
});

/**
 * Validation schema for periodo parameter
 */
const periodoSchema = z.enum(['MANHÃ', 'TARDE', 'INTEGRAL', 'NOITE']);

/**
 * Validation schema for school, period and year
 */
const schoolPeriodYearSchema = schoolYearSchema.extend({
	periodo: periodoSchema
});

/**
 * Validation schema for school, period, class and year
 */
const schoolPeriodClassYearSchema = schoolPeriodYearSchema.extend({
	turma: z.string().min(1).max(50)
});

/**
 * Fetches all distinct periods available for a school in a given year
 *
 * @param escola_id - The school INEP identifier
 * @param ano_letivo - The school year (e.g., 2025)
 * @returns Array of distinct periods or empty array on error/no results
 */
export async function getPeriodsBySchool(
	escola_id: number,
	ano_letivo: number
): Promise<PeriodData[]> {
	try {
		// Validate input
		const validationResult = schoolYearSchema.safeParse({ escola_id, ano_letivo });
		if (!validationResult.success) {
			console.error('Validation error in getPeriodsBySchool:', { escola_id, ano_letivo }, validationResult.error);
			return [];
		}

		// Query distinct periods for the school and year
		const result = await sql<PeriodData[]>`
			SELECT DISTINCT periodo
			FROM pse.matriculas
			WHERE escola_id = ${escola_id}
			AND ano_letivo = ${ano_letivo}
			ORDER BY periodo
		`;

		return result;
	} catch (error) {
		console.error('Error fetching periods for school:', { escola_id, ano_letivo }, error);
		return [];
	}
}

/**
 * Fetches all distinct classes for a school, period and year with student counts
 *
 * @param escola_id - The school INEP identifier
 * @param periodo - The period (MANHÃ, TARDE, INTEGRAL, NOITE)
 * @param ano_letivo - The school year (e.g., 2025)
 * @returns Array of classes with student counts or empty array on error/no results
 */
export async function getClassesBySchoolAndPeriod(
	escola_id: number,
	periodo: string,
	ano_letivo: number
): Promise<ClassData[]> {
	try {
		// Validate input
		const validationResult = schoolPeriodYearSchema.safeParse({ escola_id, periodo, ano_letivo });
		if (!validationResult.success) {
			console.error('Validation error in getClassesBySchoolAndPeriod:', { escola_id, periodo, ano_letivo }, validationResult.error);
			return [];
		}

		// Query distinct classes with student counts
		const result = await sql<ClassData[]>`
			SELECT
				turma,
				COUNT(DISTINCT aluno_id)::int AS total_alunos
			FROM pse.matriculas
			WHERE escola_id = ${escola_id}
			AND periodo = ${periodo}
			AND ano_letivo = ${ano_letivo}
			GROUP BY turma
			ORDER BY turma
		`;

		return result;
	} catch (error) {
		console.error('Error fetching classes for school and period:', { escola_id, periodo, ano_letivo }, error);
		return [];
	}
}

/**
 * Fetches all students enrolled in a specific class with evaluation status
 *
 * @param escola_id - The school INEP identifier
 * @param periodo - The period (MANHÃ, TARDE, INTEGRAL, NOITE)
 * @param turma - The class name (e.g., "1A", "Pré I")
 * @param ano_letivo - The school year (e.g., 2025)
 * @returns Array of students with evaluation status or empty array on error/no results
 */
export async function getStudentsByClass(
	escola_id: number,
	periodo: string,
	turma: string,
	ano_letivo: number
): Promise<StudentData[]> {
	try {
		// Validate input
		const validationResult = schoolPeriodClassYearSchema.safeParse({
			escola_id,
			periodo,
			turma,
			ano_letivo
		});
		if (!validationResult.success) {
			console.error('Validation error in getStudentsByClass:', { escola_id, periodo, turma, ano_letivo }, validationResult.error);
			return [];
		}

		// Query students with evaluation status
		const result = await sql<StudentData[]>`
			SELECT
				c.id AS aluno_id,
				c.cliente AS nome,
				c.data_nasc,
				EXTRACT(YEAR FROM AGE(c.data_nasc))::int AS idade,
				EXISTS(
					SELECT 1 FROM pse.avaliacoes_acuidade_visual av
					WHERE av.aluno_id = c.id
					AND av.ano_referencia = ${ano_letivo}
				) AS has_visual_eval,
				EXISTS(
					SELECT 1 FROM pse.avaliacoes_antropometricas aa
					WHERE aa.aluno_id = c.id
					AND aa.ano_referencia = ${ano_letivo}
				) AS has_anthropometric_eval,
				EXISTS(
					SELECT 1 FROM pse.avaliacoes_odontologicas ao
					WHERE ao.aluno_id = c.id
					AND ao.ano_referencia = ${ano_letivo}
				) AS has_dental_eval
			FROM shared.clientes c
			INNER JOIN pse.matriculas m ON c.id = m.aluno_id
			WHERE m.escola_id = ${escola_id}
			AND m.periodo = ${periodo}
			AND m.turma = ${turma}
			AND m.ano_letivo = ${ano_letivo}
			AND c.ativo = true
			ORDER BY c.cliente
		`;

		return result;
	} catch (error) {
		console.error('Error fetching students for class:', { escola_id, periodo, turma, ano_letivo }, error);
		return [];
	}
}
