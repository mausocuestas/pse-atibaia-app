import type { ParsedMatriculaRow } from '$lib/server/services/matricula-import.service';
import { parseDate, normalizeSexo, normalizePeriodo } from '$lib/server/services/matricula-import.service';
import { sql } from '$lib/server/db';

/**
 * Interface for import statistics
 */
export interface ImportStats {
	totalRecords: number;
	newStudents: number;
	updatedStudents: number;
	newSchools: number;
	newClasses: number;
	errors: Array<{
		row: number;
		message: string;
	}>;
}

/**
 * Find or create a student based on identification data
 */
export async function findOrCreateStudent(
	studentData: Partial<ParsedMatriculaRow>,
	transaction: any = sql
): Promise<{ id: number; isNew: boolean }> {
	const { nomeCompleto, dataNascimento, cpf, nis } = studentData;

	if (!nomeCompleto || !dataNascimento) {
		throw new Error('Nome completo e data de nascimento são obrigatórios');
	}

	// Try to find existing student by CPF first (most reliable)
	if (cpf) {
		const existingByCPF = await transaction`
			SELECT id FROM shared.clientes
			WHERE REPLACE(REPLACE(REPLACE(cpf::text, '.', ''), '-', ''), '/', '') = REPLACE(REPLACE(REPLACE(${cpf}, '.', ''), '-', ''), '/')
			LIMIT 1
		`;

		if (existingByCPF.length > 0) {
			return { id: existingByCPF[0].id, isNew: false };
		}
	}

	// Try to find by NIS
	if (nis) {
		const existingByNIS = await transaction`
			SELECT id FROM shared.clientes WHERE nis = ${nis} LIMIT 1
		`;

		if (existingByNIS.length > 0) {
			return { id: existingByNIS[0].id, isNew: false };
		}
	}

	// Try to find by name + birth date (less reliable but necessary)
	const parsedDate = parseDate(dataNascimento);
	const existingByName = await transaction`
		SELECT id FROM shared.clientes
		WHERE cliente = ${nomeCompleto.trim()} AND data_nasc = ${parsedDate}
		LIMIT 1
	`;

	if (existingByName.length > 0) {
		return { id: existingByName[0].id, isNew: false };
	}

	// Create new student
	const normalizedSexo = normalizeSexo(studentData.sexo);
	const newStudent = await transaction`
		INSERT INTO shared.clientes (cliente, data_nasc, sexo, cpf, nis)
		VALUES (
			${nomeCompleto.trim()},
			${parsedDate},
			${normalizedSexo},
			${cpf || null},
			${nis || null}
		)
		RETURNING id
	`;

	return { id: newStudent[0].id, isNew: true };
}

/**
 * Find or create a school based on name and INEP code
 */
export async function findOrCreateSchool(
	schoolData: Partial<ParsedMatriculaRow>,
	transaction: any = sql
): Promise<{ id: number; isNew: boolean }> {
	const { escola, inep } = schoolData;

	if (!escola) {
		throw new Error('Nome da escola é obrigatório');
	}

	// Try to find by INEP code first (most reliable)
	if (inep) {
		const existingByINEP = await transaction`
			SELECT inep FROM shared.escolas WHERE inep = ${parseInt(inep)} LIMIT 1
		`;

		if (existingByINEP.length > 0) {
			return { id: existingByINEP[0].inep, isNew: false };
		}
	}

	// Try to find by school name
	const existingByName = await transaction`
		SELECT inep FROM shared.escolas WHERE escola = ${escola.trim()} LIMIT 1
	`;

	if (existingByName.length > 0) {
		return { id: existingByName[0].inep, isNew: false };
	}

	// Generate new INEP code if not provided
	const newINEP = inep ? parseInt(inep) : await generateNextINEP(transaction);

	// Create new school
	const newSchool = await transaction`
		INSERT INTO shared.escolas (inep, escola)
		VALUES (${newINEP}, ${escola.trim()})
		RETURNING inep
	`;

	return { id: newSchool[0].inep, isNew: true };
}

/**
 * Generate next available INEP code (simplified approach)
 */
async function generateNextINEP(transaction: any): Promise<number> {
	// Find the highest INEP number and add 1
	const result = await transaction`
		SELECT MAX(inep) as max_inep FROM shared.escolas
	`;

	const maxINEP = result[0]?.max_inep || 35000000; // Start with a reasonable number
	return maxINEP + 1;
}

/**
 * Normalize and validate class (turma) data
 *
 * NOTE: The matriculas table stores turma and periodo as VARCHAR fields directly,
 * not as foreign keys to a separate turmas table. This function validates and
 * normalizes the data before insertion.
 */
export function normalizeClassData(
	classData: Partial<ParsedMatriculaRow>
): { turma: string; periodo: string } {
	const { turma, periodo } = classData;

	if (!turma || !periodo) {
		throw new Error('Dados da turma incompletos');
	}

	const normalizedPeriodo = normalizePeriodo(periodo);
	if (!normalizedPeriodo) {
		throw new Error(`Período inválido: ${periodo}`);
	}

	return {
		turma: turma.trim(),
		periodo: normalizedPeriodo
	};
}

/**
 * Create a matricula (enrollment) for a student
 *
 * NOTE: Schema uses VARCHAR fields for turma and periodo, not foreign keys
 */
export async function createMatricula(
	matriculaData: {
		alunoId: number;
		escolaId: number;
		turma: string;
		periodo: string;
		anoLetivo: number;
	},
	transaction: any = sql
): Promise<{ id: number; isNew: boolean }> {
	const { alunoId, escolaId, turma, periodo, anoLetivo } = matriculaData;

	// Check if matricula already exists for this student in this year at this school
	const existingMatricula = await transaction`
		SELECT id FROM pse.matriculas
		WHERE aluno_id = ${alunoId}
			AND escola_id = ${escolaId}
			AND ano_letivo = ${anoLetivo}
		LIMIT 1
	`;

	if (existingMatricula.length > 0) {
		// Update existing matricula with new turma/periodo if different
		const updated = await transaction`
			UPDATE pse.matriculas
			SET turma = ${turma},
				periodo = ${periodo},
				updated_at = NOW()
			WHERE id = ${existingMatricula[0].id}
			RETURNING id
		`;
		return { id: updated[0].id, isNew: false };
	}

	// Create new matricula
	const newMatricula = await transaction`
		INSERT INTO pse.matriculas (aluno_id, escola_id, turma, periodo, ano_letivo)
		VALUES (${alunoId}, ${escolaId}, ${turma}, ${periodo}, ${anoLetivo})
		RETURNING id
	`;

	return { id: newMatricula[0].id, isNew: true };
}

/**
 * Get existing school by INEP code
 */
export async function getSchoolByINEP(inep: number): Promise<any | null> {
	const result = await sql`
		SELECT inep, escola FROM shared.escolas WHERE inep = ${inep} LIMIT 1
	`;

	return result.length > 0 ? result[0] : null;
}

/**
 * Get all schools for reference
 */
export async function getAllSchools(): Promise<Array<{ inep: number; escola: string }>> {
	const result = await sql`
		SELECT inep, escola FROM shared.escolas ORDER BY escola
	`;

	return result as unknown as Array<{ inep: number; escola: string }>;
}

/**
 * Get existing student by ID
 */
export async function getStudentById(id: number): Promise<any | null> {
	const result = await sql`
		SELECT id, cliente, data_nasc, sexo, cpf, nis
		FROM shared.clientes
		WHERE id = ${id}
		LIMIT 1
	`;

	return result.length > 0 ? result[0] : null;
}

/**
 * Check if a file import was already processed (optional, for duplicate prevention)
 */
export async function checkImportHistory(fileName: string, fileSize: number): Promise<boolean> {
	// This is a placeholder for future duplicate import prevention
	// Could store file hashes or names in a log table
	return false;
}