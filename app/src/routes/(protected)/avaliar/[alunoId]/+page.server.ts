import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getStudentById, getStudentEnrollment } from '$lib/server/db/queries/students';
import { getStudentsByClass } from '$lib/server/db/queries/classes';
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

	return {
		student,
		enrollment,
		navigation: {
			previousStudentId: previousStudent?.aluno_id ?? null,
			nextStudentId: nextStudent?.aluno_id ?? null,
			currentPosition: currentIndex + 1,
			totalStudents: classStudents.length
		}
	};
};
