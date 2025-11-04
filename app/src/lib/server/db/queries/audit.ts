import { sql } from '$lib/server/db';

export interface AuditLog {
	id: number;
	table_name: string;
	record_id: number;
	action_type: 'CREATE' | 'UPDATE' | 'DELETE';
	changed_by: number;
	changed_at: Date;
	old_values: Record<string, any> | null;
	new_values: Record<string, any> | null;
	ip_address?: string;
	user_agent?: string;
}

export interface AuditLogWithUser extends AuditLog {
	changed_by_name: string;
}

/**
 * Log an enrollment change to the audit log
 * @param enrollmentId - The enrollment ID
 * @param oldValues - The old enrollment values
 * @param newValues - The new enrollment values
 * @param changedBy - The profissional ID who made the change
 * @param ipAddress - Optional IP address
 * @param userAgent - Optional user agent string
 * @returns The created audit log ID
 */
export async function logEnrollmentChange(
	enrollmentId: number,
	oldValues: Record<string, any>,
	newValues: Record<string, any>,
	changedBy: number,
	ipAddress?: string,
	userAgent?: string
): Promise<number> {
	try {
		const result = await sql`
			INSERT INTO pse.audit_logs (
				table_name,
				record_id,
				action_type,
				changed_by,
				old_values,
				new_values,
				ip_address,
				user_agent,
				changed_at
			) VALUES (
				'pse.matriculas',
				${enrollmentId},
				'UPDATE',
				${changedBy},
				${JSON.stringify(oldValues)},
				${JSON.stringify(newValues)},
				${ipAddress || null},
				${userAgent || null},
				NOW()
			)
			RETURNING id
		`;

		if (result.length === 0) {
			throw new Error('Erro ao criar log de auditoria');
		}

		return result[0].id;
	} catch (error) {
		console.error('Error logging enrollment change:', error);
		throw new Error('Erro ao registrar log de auditoria');
	}
}

/**
 * Get audit logs for a specific student
 * @param studentId - The student ID
 * @param limit - Maximum number of logs to return (default 50)
 * @returns Array of audit logs with user information
 */
export async function getAuditLogsForStudent(
	studentId: number,
	limit: number = 50
): Promise<AuditLogWithUser[]> {
	try {
		const result = await sql`
			SELECT
				al.id,
				al.table_name,
				al.record_id,
				al.action_type,
				al.changed_by,
				al.changed_at,
				al.old_values,
				al.new_values,
				al.ip_address,
				al.user_agent,
				p.nome_profissional as changed_by_name
			FROM pse.audit_logs al
			INNER JOIN shared.profissionais p ON al.changed_by = p.id
			WHERE al.table_name = 'pse.matriculas'
			AND al.record_id IN (
				SELECT id
				FROM pse.matriculas
				WHERE aluno_id = ${studentId}
			)
			ORDER BY al.changed_at DESC
			LIMIT ${limit}
		`;

		return result as unknown as AuditLogWithUser[];
	} catch (error) {
		console.error('Error getting audit logs for student:', error);
		throw new Error('Erro ao buscar logs de auditoria do aluno');
	}
}

/**
 * Get audit logs for a specific enrollment
 * @param enrollmentId - The enrollment ID
 * @param limit - Maximum number of logs to return (default 50)
 * @returns Array of audit logs with user information
 */
export async function getAuditLogsForEnrollment(
	enrollmentId: number,
	limit: number = 50
): Promise<AuditLogWithUser[]> {
	try {
		const result = await sql`
			SELECT
				al.id,
				al.table_name,
				al.record_id,
				al.action_type,
				al.changed_by,
				al.changed_at,
				al.old_values,
				al.new_values,
				al.ip_address,
				al.user_agent,
				p.nome_profissional as changed_by_name
			FROM pse.audit_logs al
			INNER JOIN shared.profissionais p ON al.changed_by = p.id
			WHERE al.table_name = 'pse.matriculas'
			AND al.record_id = ${enrollmentId}
			ORDER BY al.changed_at DESC
			LIMIT ${limit}
		`;

		return result as unknown as AuditLogWithUser[];
	} catch (error) {
		console.error('Error getting audit logs for enrollment:', error);
		throw new Error('Erro ao buscar logs de auditoria da matrícula');
	}
}

/**
 * Update enrollment with audit logging in a transaction
 * CRITICAL: This function wraps enrollment update and audit logging in a single database transaction.
 * If either operation fails, the entire transaction is rolled back to ensure data consistency.
 *
 * @param updateData - The enrollment update data
 * @param profissionalId - The profissional ID making the change
 * @param ipAddress - Optional IP address
 * @param userAgent - Optional user agent string
 * @returns Object containing updated enrollment and audit log ID
 */
export async function updateEnrollmentWithAudit(
	updateData: {
		enrollmentId: number;
		escolaId: number;
		turma: string;
		periodo: string;
		anoLetivo: number;
		observacoes?: string | null;
	},
	profissionalId: number,
	ipAddress?: string,
	userAgent?: string
): Promise<{ enrollment: any; auditLogId: number }> {
	const { enrollmentId, escolaId, turma, periodo, anoLetivo, observacoes } = updateData;

	try {
		// Execute enrollment update and audit logging in a single transaction
		const result = await sql.begin(async (tx) => {
			// Step 1: Get old enrollment values within transaction
			const oldEnrollmentResult = await tx`
				SELECT id, aluno_id, escola_id, turma, periodo, ano_letivo, observacoes
				FROM pse.matriculas
				WHERE id = ${enrollmentId}
			`;

			if (oldEnrollmentResult.length === 0) {
				throw new Error('Matrícula não encontrada');
			}

			const oldEnrollment = oldEnrollmentResult[0];

			// Step 2: Check for duplicate enrollment
			const duplicateCheck = await tx`
				SELECT id
				FROM pse.matriculas
				WHERE aluno_id = ${oldEnrollment.aluno_id}
				AND escola_id = ${escolaId}
				AND turma = ${turma}
				AND periodo = ${periodo}
				AND ano_letivo = ${anoLetivo}
				AND id != ${enrollmentId}
			`;

			if (duplicateCheck.length > 0) {
				throw new Error('Aluno já matriculado nesta turma, escola e período');
			}

			// Step 3: Verify school exists and is active
			const schoolCheck = await tx`
				SELECT inep, ativo
				FROM shared.escolas
				WHERE inep = ${escolaId}
			`;

			if (schoolCheck.length === 0) {
				throw new Error('Escola não encontrada');
			}

			if (schoolCheck[0].ativo !== 'S') {
				throw new Error('Escola não está ativa');
			}

			// Step 4: Update enrollment
			const updatedEnrollment = await tx`
				UPDATE pse.matriculas
				SET
					escola_id = ${escolaId},
					turma = ${turma},
					periodo = ${periodo},
					ano_letivo = ${anoLetivo},
					observacoes = ${observacoes ?? null},
					updated_at = NOW()
				WHERE id = ${enrollmentId}
				RETURNING *
			`;

			if (updatedEnrollment.length === 0) {
				throw new Error('Erro ao atualizar matrícula');
			}

			// Step 5: Prepare audit log values (include observacoes)
			const oldValues = {
				escola_id: oldEnrollment.escola_id,
				turma: oldEnrollment.turma,
				periodo: oldEnrollment.periodo,
				ano_letivo: oldEnrollment.ano_letivo,
				observacoes: oldEnrollment.observacoes
			};

			const newValues = {
				escola_id: updatedEnrollment[0].escola_id,
				turma: updatedEnrollment[0].turma,
				periodo: updatedEnrollment[0].periodo,
				ano_letivo: updatedEnrollment[0].ano_letivo,
				observacoes: updatedEnrollment[0].observacoes
			};

			// Step 6: Insert audit log
			const auditLogResult = await tx`
				INSERT INTO pse.audit_logs (
					table_name,
					record_id,
					action_type,
					changed_by,
					old_values,
					new_values,
					ip_address,
					user_agent,
					changed_at
				) VALUES (
					'pse.matriculas',
					${enrollmentId},
					'UPDATE',
					${profissionalId},
					${JSON.stringify(oldValues)},
					${JSON.stringify(newValues)},
					${ipAddress ?? null},
					${userAgent ?? null},
					NOW()
				)
				RETURNING id
			`;

			if (auditLogResult.length === 0) {
				throw new Error('Erro ao criar log de auditoria');
			}

			// Return both enrollment and audit log ID
			return {
				enrollment: updatedEnrollment[0],
				auditLogId: auditLogResult[0].id
			};
		});

		return result;
	} catch (error) {
		console.error('Error updating enrollment with audit (transaction rolled back):', error);

		// Re-throw known errors with proper messages
		if (error instanceof Error) {
			throw error;
		}

		throw new Error('Erro ao atualizar matrícula com auditoria');
	}
}
