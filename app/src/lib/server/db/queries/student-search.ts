import { sql } from '$lib/server/db';

export interface StudentSearchCriteria {
	nome?: string;
	dataNascimento?: string;
	cpf?: string;
}

export interface StudentSearchResult {
	id: number;
	nomeCompleto: string;
	dataNascimento: string;
	cpf?: string;
	cns?: string;
	existingEnrollments?: Array<{
		escolaId: number;
		escolaNome: string;
		turma: string;
		periodo: string;
		anoLetivo: number;
	}>;
}

/**
 * Search for students based on flexible criteria
 * @param criteria - Search criteria object
 * @returns Array of matching students
 */
export async function searchStudents(criteria: StudentSearchCriteria): Promise<StudentSearchResult[]> {
	// Build base query
	let query = sql`
		SELECT
			c.id,
			c.cliente as nome_completo,
			c.data_nasc,
			c.cpf,
			c.cns
		FROM shared.clientes c
		WHERE c.ativo = true
	`;

	// Add name search condition (partial matching)
	if (criteria.nome && criteria.nome.trim()) {
		query = sql`${query} AND c.cliente ILIKE ${'%' + criteria.nome.trim() + '%'}`;
	}

	// Add date of birth condition (exact matching)
	if (criteria.dataNascimento) {
		query = sql`${query} AND c.data_nasc = ${criteria.dataNascimento}`;
	}

	// Add CPF condition (exact matching, removing formatting)
	if (criteria.cpf) {
		const cleanCpf = criteria.cpf.replace(/\D/g, ''); // Remove non-digits
		if (cleanCpf.length === 11) {
			query = sql`${query} AND c.cpf = ${cleanCpf}`;
		}
	}

	// Add ordering and limit
	query = sql`${query} ORDER BY c.cliente LIMIT 50`;

	try {
		const results = await query;

		// Format results
		const formattedResults: StudentSearchResult[] = results.map((row: any) => ({
			id: row.id,
			nomeCompleto: row.nome_completo,
			dataNascimento: row.data_nasc,
			cpf: row.cpf,
			cns: row.cns
		}));

		return formattedResults;
	} catch (error) {
		console.error('Error searching students:', error);
		throw new Error('Erro ao buscar alunos no banco de dados');
	}
}

/**
 * Get existing enrollments for a student
 * @param studentId - The student ID
 * @returns Array of existing enrollments
 */
export async function getStudentEnrollments(studentId: number): Promise<StudentSearchResult['existingEnrollments']> {
	try {
		const results = await sql`
			SELECT
				m.escola_id,
				e.escola as escola_nome,
				m.turma,
				m.periodo,
				m.ano_letivo
			FROM pse.matriculas m
			INNER JOIN shared.escolas e ON m.escola_id = e.inep
			WHERE m.aluno_id = ${studentId}
			ORDER BY m.ano_letivo DESC, m.turma
		`;

		return results.map((row: any) => ({
			escolaId: row.escola_id,
			escolaNome: row.escola_nome,
			turma: row.turma,
			periodo: row.periodo,
			anoLetivo: row.ano_letivo
		}));
	} catch (error) {
		console.error('Error getting student enrollments:', error);
		return [];
	}
}

/**
 * Search for students with their existing enrollments
 * @param criteria - Search criteria object
 * @returns Array of matching students with enrollment info
 */
export async function searchStudentsWithEnrollments(criteria: StudentSearchCriteria): Promise<StudentSearchResult[]> {
	const students = await searchStudents(criteria);

	// Get enrollments for each student
	for (const student of students) {
		student.existingEnrollments = await getStudentEnrollments(student.id);
	}

	return students;
}