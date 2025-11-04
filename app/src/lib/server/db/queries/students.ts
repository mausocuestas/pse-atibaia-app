import { sql } from '$lib/server/db';
import { z } from 'zod';
import type { Cliente } from '$lib/server/db/types';
import { enrollStudentInClass, type EnrollmentData, type Matricula } from './enrollment';

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
 * Data structure for creating a new student
 */
export interface StudentCreateData {
	cliente: string;
	data_nasc: Date;
	sexo: 'M' | 'F';
	cpf?: string;
	cns?: string; // Cartão Nacional de Saúde (NOT 'nis')
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

/**
 * Clean and format CPF (remove non-digits)
 * @param cpf - CPF string with or without formatting
 * @returns CPF with only digits
 */
function cleanCPF(cpf: string): string {
	return cpf.replace(/\D/g, '');
}

/**
 * Check if a CPF already exists in the database
 * @param cpf - CPF to check (will be cleaned)
 * @returns true if CPF exists, false otherwise
 */
async function checkDuplicateCPF(cpf: string): Promise<boolean> {
	try {
		const cleanedCPF = cleanCPF(cpf);
		const result = await sql`
			SELECT id
			FROM shared.clientes
			WHERE cpf = ${cleanedCPF}
			AND ativo = true
			LIMIT 1
		`;
		return result.length > 0;
	} catch (error) {
		console.error('checkDuplicateCPF error:', error);
		throw new Error('Erro ao verificar CPF duplicado');
	}
}

/**
 * Creates a new student in the database
 * @param data - Student creation data
 * @returns Created student record
 * @throws Error if validation fails or CPF is duplicated
 */
export async function createStudent(data: StudentCreateData): Promise<Cliente> {
	try {
		// Validate input with Zod
		const schema = z.object({
			cliente: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(255, 'Nome muito longo'),
			data_nasc: z.date().refine((date) => {
				// Check if date is in the past
				const today = new Date();
				today.setHours(0, 0, 0, 0);
				return date < today;
			}, 'Data de nascimento deve ser no passado').refine((date) => {
				// Check if date is reasonable (not more than 120 years ago)
				const minDate = new Date();
				minDate.setFullYear(minDate.getFullYear() - 120);
				return date > minDate;
			}, 'Data de nascimento inválida'),
			sexo: z.enum(['M', 'F'], { message: 'Sexo deve ser M ou F' }),
			cpf: z.string().length(11, 'CPF deve ter 11 dígitos').optional().or(z.literal('')),
			cns: z.string().max(15, 'CNS muito longo').optional().or(z.literal(''))
		});

		const validated = schema.parse({
			...data,
			cpf: data.cpf ? cleanCPF(data.cpf) : undefined
		});

		// Check for duplicate CPF if provided
		if (validated.cpf && validated.cpf.length > 0) {
			const isDuplicate = await checkDuplicateCPF(validated.cpf);
			if (isDuplicate) {
				throw new Error('CPF já cadastrado no sistema');
			}
		}

		// Insert new student
		const result = await sql<Cliente[]>`
			INSERT INTO shared.clientes (
				cliente,
				data_nasc,
				sexo,
				cpf,
				cns,
				ativo
			) VALUES (
				${validated.cliente},
				${validated.data_nasc},
				${validated.sexo},
				${validated.cpf && validated.cpf.length > 0 ? validated.cpf : null},
				${validated.cns && validated.cns.length > 0 ? validated.cns : null},
				true
			)
			RETURNING *
		`;

		if (result.length === 0) {
			throw new Error('Erro ao criar aluno');
		}

		return result[0];
	} catch (error) {
		console.error('createStudent error:', error);

		// Re-throw validation errors with user-friendly messages
		if (error instanceof z.ZodError) {
			const firstError = error.issues[0];
			throw new Error(firstError.message);
		}

		// Re-throw known errors
		if (error instanceof Error) {
			throw error;
		}

		// Generic error
		throw new Error('Erro ao criar aluno');
	}
}

/**
 * Creates a new student and immediately enrolls them in a class
 * @param studentData - Student creation data
 * @param enrollmentData - Enrollment data (without studentId)
 * @returns Object containing created student and enrollment records
 * @throws Error if student creation or enrollment fails
 */
export async function createAndEnrollStudent(
	studentData: StudentCreateData,
	enrollmentData: Omit<EnrollmentData, 'studentId'>
): Promise<{ student: Cliente; enrollment: Matricula }> {
	try {
		// Create student first
		const student = await createStudent(studentData);

		// Then enroll using existing function from Story 4.2
		const enrollment = await enrollStudentInClass({
			studentId: student.id,
			...enrollmentData
		});

		return { student, enrollment };
	} catch (error) {
		console.error('createAndEnrollStudent error:', error);

		// If it's a known error, re-throw it
		if (error instanceof Error) {
			throw error;
		}

		// Generic error
		throw new Error('Erro ao criar e matricular aluno');
	}
}
