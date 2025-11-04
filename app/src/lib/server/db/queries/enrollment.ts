import { sql } from '$lib/server/db';

export interface EnrollmentData {
	studentId: number;
	escolaId: number;
	turma: string;
	periodo: string;
	anoLetivo: number;
}

export interface Matricula {
	id: number;
	aluno_id: number;
	escola_id: number;
	turma: string;
	periodo: string;
	ano_letivo: number;
	created_at?: string;
}

export interface StudentInfo {
	id: number;
	nomeCompleto: string;
	dataNascimento: string;
}

/**
 * Check if a student is already enrolled in a specific class
 * @param studentId - The student ID
 * @param escolaId - The school ID (INEP)
 * @param turma - The class name
 * @param periodo - The period (MANHA, TARDE, etc.)
 * @param anoLetivo - The school year
 * @returns True if already enrolled, false otherwise
 */
export async function checkExistingEnrollment(
	studentId: number,
	escolaId: number,
	turma: string,
	periodo: string,
	anoLetivo: number
): Promise<boolean> {
	try {
		const result = await sql`
			SELECT id
			FROM pse.matriculas
			WHERE aluno_id = ${studentId}
			AND escola_id = ${escolaId}
			AND turma = ${turma}
			AND periodo = ${periodo}
			AND ano_letivo = ${anoLetivo}
			LIMIT 1
		`;

		return result.length > 0;
	} catch (error) {
		console.error('Error checking existing enrollment:', error);
		throw new Error('Erro ao verificar matrícula existente');
	}
}

/**
 * Get basic student information
 * @param studentId - The student ID
 * @returns Student information
 */
export async function getStudentInfo(studentId: number): Promise<StudentInfo | null> {
	try {
		const result = await sql`
			SELECT
				id,
				cliente as nome_completo,
				data_nasc
			FROM shared.clientes
			WHERE id = ${studentId}
			AND ativo = true
			LIMIT 1
		`;

		if (result.length === 0) {
			return null;
		}

		const row = result[0];
		return {
			id: row.id,
			nomeCompleto: row.nome_completo,
			dataNascimento: row.data_nasc
		};
	} catch (error) {
		console.error('Error getting student info:', error);
		throw new Error('Erro ao obter informações do aluno');
	}
}

/**
 * Enroll a student in a class
 * @param enrollmentData - The enrollment data
 * @returns The created enrollment record
 */
export async function enrollStudentInClass(enrollmentData: EnrollmentData): Promise<Matricula> {
	const { studentId, escolaId, turma, periodo, anoLetivo } = enrollmentData;

	try {
		// Check if student exists
		const studentInfo = await getStudentInfo(studentId);
		if (!studentInfo) {
			throw new Error('Aluno não encontrado');
		}

		// Check for existing enrollment
		const alreadyEnrolled = await checkExistingEnrollment(
			studentId,
			escolaId,
			turma,
			periodo,
			anoLetivo
		);

		if (alreadyEnrolled) {
			throw new Error('Aluno já matriculado nesta turma');
		}

		// Create new enrollment
		const result = await sql<Matricula[]>`
			INSERT INTO pse.matriculas (aluno_id, escola_id, turma, periodo, ano_letivo)
			VALUES (${studentId}, ${escolaId}, ${turma}, ${periodo}, ${anoLetivo})
			RETURNING *
		`;

		if (result.length === 0) {
			throw new Error('Erro ao criar matrícula');
		}

		return result[0];
	} catch (error) {
		console.error('Error enrolling student:', error);

		// Re-throw known errors
		if (error instanceof Error) {
			throw error;
		}

		// Throw generic error for unknown issues
		throw new Error('Erro ao matricular aluno');
	}
}

/**
 * Get enrollment with student information
 * @param enrollmentData - The enrollment data
 * @returns The enrollment with student info
 */
export async function enrollStudentWithInfo(enrollmentData: EnrollmentData): Promise<{
	enrollment: Matricula;
	student: StudentInfo;
}> {
	const enrollment = await enrollStudentInClass(enrollmentData);
	const student = await getStudentInfo(enrollmentData.studentId);

	if (!student) {
		throw new Error('Erro ao obter informações do aluno após matrícula');
	}

	return {
		enrollment,
		student
	};
}