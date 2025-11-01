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
 * Find or create a class (turma) for a given school
 */
export async function findOrCreateClass(
	classData: Partial<ParsedMatriculaRow> & { escolaId: number; anoLetivo: number },
	transaction: any = sql
): Promise<{ id: number; isNew: boolean }> {
	const { turma, periodo, escolaId, anoLetivo } = classData;

	if (!turma || !periodo || !escolaId || !anoLetivo) {
		throw new Error('Dados da turma incompletos');
	}

	const normalizedPeriodo = normalizePeriodo(periodo);
	if (!normalizedPeriodo) {
		throw new Error(`Período inválido: ${periodo}`);
	}

	// Try to find existing class
	const existingClass = await transaction`
		SELECT id FROM pse.turmas
		WHERE escola_id = ${escolaId}
			AND nome = ${turma.trim()}
			AND periodo = ${normalizedPeriodo}
			AND ano_letivo = ${anoLetivo}
		LIMIT 1
	`;

	if (existingClass.length > 0) {
		return { id: existingClass[0].id, isNew: false };
	}

	// Create new class
	const newClass = await transaction`
		INSERT INTO pse.turmas (escola_id, nome, periodo, ano_letivo)
		VALUES (${escolaId}, ${turma.trim()}, ${normalizedPeriodo}, ${anoLetivo})
		RETURNING id
	`;

	return { id: newClass[0].id, isNew: true };
}

/**
 * Create a matricula (enrollment) for a student
 */
export async function createMatricula(
	matriculaData: {
		alunoId: number;
		turmaId: number;
		anoLetivo: number;
	},
	transaction: any = sql
): Promise<{ id: number }> {
	const { alunoId, turmaId, anoLetivo } = matriculaData;

	// Check if matricula already exists
	const existingMatricula = await transaction`
		SELECT id FROM pse.matriculas
		WHERE aluno_id = ${alunoId}
			AND turma_id = ${turmaId}
			AND ano_letivo = ${anoLetivo}
		LIMIT 1
	`;

	if (existingMatricula.length > 0) {
		return { id: existingMatricula[0].id };
	}

	// Create new matricula
	const newMatricula = await transaction`
		INSERT INTO pse.matriculas (aluno_id, turma_id, ano_letivo)
		VALUES (${alunoId}, ${turmaId}, ${anoLetivo})
		RETURNING id
	`;

	return { id: newMatricula[0].id };
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