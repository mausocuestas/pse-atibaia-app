import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getStudentById, getStudentEnrollment } from '$lib/server/db/queries/students';
import { getStudentsByClass } from '$lib/server/db/queries/classes';
import {
	getAnthropometryEvaluation,
	saveAnthropometryEvaluation
} from '$lib/server/db/queries/anthropometry';
import {
	getVisualAcuityEvaluation,
	saveVisualAcuityEvaluation
} from '$lib/server/db/queries/visual-acuity';
import { getDentalEvaluation, saveDentalEvaluation } from '$lib/server/db/queries/dental';
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

	// Load existing visual acuity evaluation
	const visualAcuity = await getVisualAcuityEvaluation(alunoId, CURRENT_YEAR);

	// Load existing dental evaluation
	const dental = await getDentalEvaluation(alunoId, CURRENT_YEAR);

	return {
		student,
		enrollment,
		navigation: {
			previousStudentId: previousStudent?.aluno_id ?? null,
			nextStudentId: nextStudent?.aluno_id ?? null,
			currentPosition: currentIndex + 1,
			totalStudents: classStudents.length
		},
		anthropometry,
		visualAcuity,
		dental
	};
};

export const actions: Actions = {
	saveEvaluation: async ({ request, params, locals }) => {
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

		// Fetch student data (needed for anthropometry calculations)
		const student = await getStudentById(alunoId);
		if (!student || !student.data_nasc) {
			return fail(404, { error: 'Student not found or missing birth date' });
		}

		// Fetch enrollment for escola_id
		const enrollment = await getStudentEnrollment(alunoId, CURRENT_YEAR);
		if (!enrollment) {
			return fail(404, { error: 'Student enrollment not found' });
		}

		// Extract session user data
		const profissional_id = (session?.user as any)?.profissional_id;
		const usf_id = (session?.user as any)?.usf_id;

		try {
			// Save Anthropometry data if present
			if (formData.has('peso_kg') || formData.has('altura_cm')) {
				const pesoKg = Number(formData.get('peso_kg'));
				const alturaCm = Number(formData.get('altura_cm'));
				const observacoesAntro = formData.get('observacoes_antropometria')?.toString() || null;

				// Validate peso and altura
				if (pesoKg > 0 && alturaCm > 0) {
					if (pesoKg > 300) {
						return fail(400, { error: 'Peso inválido. Deve ser entre 0 e 300 kg.' });
					}
					if (alturaCm > 250) {
						return fail(400, { error: 'Altura inválida. Deve ser entre 0 e 250 cm.' });
					}

					// Calculate BMI and CDC classification
					const imc = calculateBMI(pesoKg, alturaCm);
					const age = calculateAge(student.data_nasc);
					const classificacaoCDC = calculateCDCClassification(imc, age, student.sexo ?? 'M');

					// Save to database
					await saveAnthropometryEvaluation({
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
						observacoes: observacoesAntro
					});
				}
			}

			// Save Visual Acuity data if present
			if (
				formData.has('olho_direito') ||
				formData.has('olho_esquerdo') ||
				formData.has('olho_direito_reteste') ||
				formData.has('olho_esquerdo_reteste')
			) {
				const olhoDireito = formData.get('olho_direito')
					? Number(formData.get('olho_direito'))
					: null;
				const olhoEsquerdo = formData.get('olho_esquerdo')
					? Number(formData.get('olho_esquerdo'))
					: null;
				const olhoDireitoReteste = formData.get('olho_direito_reteste')
					? Number(formData.get('olho_direito_reteste'))
					: null;
				const olhoEsquerdoReteste = formData.get('olho_esquerdo_reteste')
					? Number(formData.get('olho_esquerdo_reteste'))
					: null;
				const observacoesVisual = formData.get('observacoes_visual')?.toString() || null;

				// Calculate tem_problema flags based on threshold (< 0.7 indicates potential issue)
				// Use reteste value if present, otherwise use initial measurement
				const temProblemaOD =
					olhoDireitoReteste !== null
						? olhoDireitoReteste < 0.7
						: olhoDireito !== null
							? olhoDireito < 0.7
							: null;

				const temProblemaOE =
					olhoEsquerdoReteste !== null
						? olhoEsquerdoReteste < 0.7
						: olhoEsquerdo !== null
							? olhoEsquerdo < 0.7
							: null;

				const visualResult = await saveVisualAcuityEvaluation({
					aluno_id: alunoId,
					escola_id: enrollment.escola_id,
					profissional_id: profissional_id ?? null,
					usf_id: usf_id ?? null,
					ano_referencia: CURRENT_YEAR,
					olho_direito: olhoDireito,
					olho_esquerdo: olhoEsquerdo,
					olho_direito_reteste: olhoDireitoReteste,
					olho_esquerdo_reteste: olhoEsquerdoReteste,
					tem_problema_od: temProblemaOD,
					tem_problema_oe: temProblemaOE,
					observacoes: observacoesVisual
				});

				if (!visualResult) {
					console.error('Failed to save visual acuity data');
					return fail(500, { error: 'Falha ao salvar dados de acuidade visual' });
				}
			}

			// Save Dental Evaluation data if present
			if (formData.has('risco')) {
				const risco = formData.get('risco')?.toString();
				const complemento = formData.get('complemento')?.toString() || null;
				const classificacaoCompleta = formData.get('classificacao_completa')?.toString() || null;
				const receberATF = formData.get('recebeu_atf') === 'true';
				const precisaART = formData.get('precisa_art') === 'true';
				const qtdeDentesART = formData.get('qtde_dentes_art')
					? Number(formData.get('qtde_dentes_art'))
					: 0;
				const hasEscovacao = formData.get('has_escovacao') === 'true';
				const observacoesDental = formData.get('observacoes_dental')?.toString() || null;

				if (risco) {
					const dentalResult = await saveDentalEvaluation({
						aluno_id: alunoId,
						escola_id: enrollment.escola_id,
						profissional_id: profissional_id ?? null,
						usf_id: usf_id ?? null,
						ano_referencia: CURRENT_YEAR,
						risco: risco as 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G',
						complemento: complemento as '+' | '-' | null,
						classificacao_completa: classificacaoCompleta,
						recebeu_atf: receberATF,
						precisa_art: precisaART,
						qtde_dentes_art: precisaART ? qtdeDentesART : 0, // Force 0 if ART not needed
						has_escovacao: hasEscovacao,
						observacoes: observacoesDental
					});

					if (!dentalResult) {
						console.error('Failed to save dental evaluation data');
						return fail(500, { error: 'Falha ao salvar dados de avaliação odontológica' });
					}
				}
			}

			return { success: true };
		} catch (error) {
			console.error('Error saving evaluation data:', error);
			return fail(500, { error: 'Falha ao salvar dados de avaliação' });
		}
	}
};
