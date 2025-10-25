import { sql } from '$lib/server/db';
import { z } from 'zod';
import type { Cliente } from '$lib/server/db/types';

/**
 * Student enrollment information including school context
 */
export interface StudentEnrollmentInfo {
	matricula_id: number;
	aluno_id: number;
	escola_id: number;
	escola_nome: string;
	ano_letivo: number;
	turma: string;
	periodo: string;
}

/**
 * Fetches a student by their ID
 * @param alunoId - The student's ID
 * @returns Student data or null if not found
 */
export async function getStudentById(alunoId: number): Promise<Cliente | null> {
	try {
		// Validate input
		const alunoIdSchema = z.number().positive();
		const validationResult = alunoIdSchema.safeParse(alunoId);
		if (!validationResult.success) {
			console.error('getStudentById validation error:', alunoId);
			return null;
		}

		// Execute query
		const result = await sql<Cliente[]>`
			SELECT *
			FROM shared.clientes
			WHERE id = ${alunoId}
			AND ativo = true
		`;

		return result.length > 0 ? result[0] : null;
	} catch (error) {
		console.error('getStudentById error:', error);
		return null;
	}
}

/**
 * Fetches student enrollment information including school context
 * @param alunoId - The student's ID
 * @param anoLetivo - The school year
 * @returns Enrollment information or null if not found
 */
export async function getStudentEnrollment(
	alunoId: number,
	anoLetivo: number
): Promise<StudentEnrollmentInfo | null> {
	try {
		// Validation
		const schema = z.object({
			alunoId: z.number().positive(),
			anoLetivo: z.number().min(2000).max(2100)
		});
		const validationResult = schema.safeParse({ alunoId, anoLetivo });
		if (!validationResult.success) {
			console.error('getStudentEnrollment validation error:', { alunoId, anoLetivo });
			return null;
		}

		// Execute query with JOIN to get escola name
		const result = await sql<StudentEnrollmentInfo[]>`
			SELECT
				m.id as matricula_id,
				m.aluno_id,
				m.escola_id,
				e.escola as escola_nome,
				m.ano_letivo,
				m.turma,
				m.periodo
			FROM pse.matriculas m
			INNER JOIN shared.escolas e ON m.escola_id = e.inep
			WHERE m.aluno_id = ${alunoId}
			AND m.ano_letivo = ${anoLetivo}
			LIMIT 1
		`;

		return result.length > 0 ? result[0] : null;
	} catch (error) {
		console.error('getStudentEnrollment error:', error);
		return null;
	}
}
