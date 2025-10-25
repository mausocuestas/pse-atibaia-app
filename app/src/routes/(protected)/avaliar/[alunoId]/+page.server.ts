import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getStudentById, getStudentEnrollment } from '$lib/server/db/queries/students';
import { getStudentsByClass } from '$lib/server/db/queries/classes';
import {
	getAnthropometryEvaluation,
	saveAnthropometryEvaluation
} from '$lib/server/db/queries/anthropometry';
import { calculateBMI, calculateCDCClassification } from '$lib/utils/cdc-classification';
import { calculateAge } from '$lib/utils/periods';
import { z } from 'zod';

const CURRENT_YEAR = 2025;

export const load: PageServerLoad = async ({ params }) => {
	// Validate and parse alunoId
	const alunoIdSchema = z.string().regex(/^\d+$/);
	const validationResult = alunoIdSchema.safeParse(params.alunoId);

	if (!validationResult.success) {
		throw error(400, 'Invalid student ID');
	}

	const alunoId = Number(params.alunoId);

	// Fetch student data
	const student = await getStudentById(alunoId);
	if (!student) {
		throw error(404, 'Student not found');
	}

	// Fetch enrollment context
	const enrollment = await getStudentEnrollment(alunoId, CURRENT_YEAR);
	if (!enrollment) {
		throw error(404, 'Student enrollment not found for current year');
	}

	// Fetch all students in the same class for navigation
	const classStudents = await getStudentsByClass(
		enrollment.escola_id,
		enrollment.periodo,
		enrollment.turma,
		CURRENT_YEAR
	);

	// Find current student index in the list
	const currentIndex = classStudents.findIndex((s) => s.aluno_id === alunoId);

	if (currentIndex === -1) {
		throw error(404, 'Student not found in class list');
	}

	// Calculate prev/next student IDs
	const previousStudent = currentIndex > 0 ? classStudents[currentIndex - 1] : null;
	const nextStudent = currentIndex < classStudents.length - 1 ? classStudents[currentIndex + 1] : null;

	// Load existing anthropometry evaluation
	const anthropometry = await getAnthropometryEvaluation(alunoId, CURRENT_YEAR);

	return {
		student,
		enrollment,
		navigation: {
			previousStudentId: previousStudent?.aluno_id ?? null,
			nextStudentId: nextStudent?.aluno_id ?? null,
			currentPosition: currentIndex + 1,
			totalStudents: classStudents.length
		},
		anthropometry
	};
};

export const actions: Actions = {
	saveAnthropometry: async ({ request, params, locals }) => {
		const session = await locals.auth();

		if (!session) {
			return fail(401, { error: 'Unauthorized' });
		}

		// Validate alunoId
		const alunoId = Number(params.alunoId);
		if (isNaN(alunoId) || alunoId <= 0) {
			return fail(400, { error: 'Invalid student ID' });
		}

		// Get form data
		const formData = await request.formData();
		const pesoKg = Number(formData.get('peso_kg'));
		const alturaCm = Number(formData.get('altura_cm'));
		const observacoes = formData.get('observacoes')?.toString() || null;

		// Validate peso and altura
		if (isNaN(pesoKg) || pesoKg <= 0 || pesoKg > 300) {
			return fail(400, { error: 'Peso inválido. Deve ser entre 0 e 300 kg.' });
		}

		if (isNaN(alturaCm) || alturaCm <= 0 || alturaCm > 250) {
			return fail(400, { error: 'Altura inválida. Deve ser entre 0 e 250 cm.' });
		}

		// Fetch student data for age and sex
		const student = await getStudentById(alunoId);
		if (!student || !student.data_nasc) {
			return fail(404, { error: 'Student not found or missing birth date' });
		}

		// Fetch enrollment for escola_id
		const enrollment = await getStudentEnrollment(alunoId, CURRENT_YEAR);
		if (!enrollment) {
			return fail(404, { error: 'Student enrollment not found' });
		}

		// Calculate BMI and CDC classification
		const imc = calculateBMI(pesoKg, alturaCm);
		const age = calculateAge(student.data_nasc);
		const classificacaoCDC = calculateCDCClassification(imc, age, student.sexo ?? 'M');

		// Extract session user data
		const profissional_id = (session?.user as any)?.profissional_id;
		const usf_id = (session?.user as any)?.usf_id;

		// Save to database
		const result = await saveAnthropometryEvaluation({
			aluno_id: alunoId,
			escola_id: enrollment.escola_id,
			profissional_id: profissional_id ?? null,
			usf_id: usf_id ?? null,
			ano_referencia: CURRENT_YEAR,
			peso_kg: pesoKg,
			altura_cm: alturaCm,
			data_nascimento: student.data_nasc,
			sexo: (student.sexo ?? 'M') as 'M' | 'F',
			imc,
			classificacao_cdc: classificacaoCDC,
			observacoes
		});

		if (!result) {
			return fail(500, { error: 'Falha ao salvar dados de antropometria' });
		}

		return { success: true, data: result };
	}
};
