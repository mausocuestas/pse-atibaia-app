import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load } from '../[alunoId]/+page.server';
import type { Cliente } from '$lib/server/db/types';
import type { StudentEnrollmentInfo } from '$lib/server/db/queries/students';

type LoadResult = {
	student: Cliente;
	enrollment: StudentEnrollmentInfo;
	navigation: {
		previousStudentId: number | null;
		nextStudentId: number | null;
		currentPosition: number;
		totalStudents: number;
	};
};

// Mock the query functions
vi.mock('$lib/server/db/queries/students', () => ({
	getStudentById: vi.fn(),
	getStudentEnrollment: vi.fn()
}));

vi.mock('$lib/server/db/queries/classes', () => ({
	getStudentsByClass: vi.fn()
}));

import { getStudentById, getStudentEnrollment } from '$lib/server/db/queries/students';
import { getStudentsByClass } from '$lib/server/db/queries/classes';

describe('Evaluation page server load', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const mockStudent: Cliente = {
		id: 1,
		cliente: 'João Silva',
		data_nasc: new Date('2015-03-15'),
		sexo: 'M',
		cpf: '12345678901',
		cns: '123456789012345',
		ativo: true,
		created_at: new Date(),
		updated_at: new Date(),
		fone: null,
		cep: null,
		logradouro: null,
		numero: null,
		complemento: null,
		bairro: null,
		municipio: null,
		uf: null,
		nome_responsavel: null,
		fone_responsavel: null,
		observacoes: null,
		ra: null
	};

	const mockEnrollment: StudentEnrollmentInfo = {
		matricula_id: 1,
		aluno_id: 1,
		escola_id: 23001234,
		escola_nome: 'Escola Municipal Test',
		ano_letivo: 2025,
		turma: '1A',
		periodo: 'MANHÃ'
	};

	const mockClassStudents = [
		{
			aluno_id: 1,
			nome: 'Ana Silva',
			data_nasc: new Date('2015-01-10'),
			idade: 10,
			has_visual_eval: false,
			has_anthropometric_eval: false,
			has_dental_eval: false
		},
		{
			aluno_id: 2,
			nome: 'Bruno Santos',
			data_nasc: new Date('2015-02-15'),
			idade: 10,
			has_visual_eval: false,
			has_anthropometric_eval: false,
			has_dental_eval: false
		},
		{
			aluno_id: 3,
			nome: 'Carlos Oliveira',
			data_nasc: new Date('2015-03-20'),
			idade: 10,
			has_visual_eval: false,
			has_anthropometric_eval: false,
			has_dental_eval: false
		}
	];

	it('should load page data successfully for valid student', async () => {
		vi.mocked(getStudentById).mockResolvedValue(mockStudent);
		vi.mocked(getStudentEnrollment).mockResolvedValue(mockEnrollment);
		vi.mocked(getStudentsByClass).mockResolvedValue(mockClassStudents);

		const result = (await load({
			params: { alunoId: '2' }
		} as any)) as LoadResult;

		expect(result.student).toEqual(mockStudent);
		expect(result.enrollment).toEqual(mockEnrollment);
		expect(result.navigation.currentPosition).toBe(2);
		expect(result.navigation.totalStudents).toBe(3);
		expect(result.navigation.previousStudentId).toBe(1);
		expect(result.navigation.nextStudentId).toBe(3);
	});

	it('should handle first student in class (no previous)', async () => {
		vi.mocked(getStudentById).mockResolvedValue(mockStudent);
		vi.mocked(getStudentEnrollment).mockResolvedValue(mockEnrollment);
		vi.mocked(getStudentsByClass).mockResolvedValue(mockClassStudents);

		const result = await load({
			params: { alunoId: '1' }
		} as any) as LoadResult;

		expect(result.navigation.previousStudentId).toBeNull();
		expect(result.navigation.nextStudentId).toBe(2);
		expect(result.navigation.currentPosition).toBe(1);
	});

	it('should handle last student in class (no next)', async () => {
		vi.mocked(getStudentById).mockResolvedValue(mockStudent);
		vi.mocked(getStudentEnrollment).mockResolvedValue(mockEnrollment);
		vi.mocked(getStudentsByClass).mockResolvedValue(mockClassStudents);

		const result = await load({
			params: { alunoId: '3' }
		} as any) as LoadResult;

		expect(result.navigation.previousStudentId).toBe(2);
		expect(result.navigation.nextStudentId).toBeNull();
		expect(result.navigation.currentPosition).toBe(3);
	});

	it('should throw 400 error for invalid alunoId format', async () => {
		await expect(
			load({
				params: { alunoId: 'invalid' }
			} as any)
		).rejects.toThrow();
	});

	it('should throw 404 error when student not found', async () => {
		vi.mocked(getStudentById).mockResolvedValue(null);

		await expect(
			load({
				params: { alunoId: '999' }
			} as any)
		).rejects.toThrow();
	});

	it('should throw 404 error when enrollment not found', async () => {
		vi.mocked(getStudentById).mockResolvedValue(mockStudent);
		vi.mocked(getStudentEnrollment).mockResolvedValue(null);

		await expect(
			load({
				params: { alunoId: '1' }
			} as any)
		).rejects.toThrow();
	});

	it('should throw 404 error when student not in class list', async () => {
		vi.mocked(getStudentById).mockResolvedValue(mockStudent);
		vi.mocked(getStudentEnrollment).mockResolvedValue(mockEnrollment);
		vi.mocked(getStudentsByClass).mockResolvedValue([
			// Student with id 1 is not in this list
			{
				aluno_id: 2,
				nome: 'Bruno Santos',
				data_nasc: new Date('2015-02-15'),
				idade: 10,
				has_visual_eval: false,
				has_anthropometric_eval: false,
				has_dental_eval: false
			}
		]);

		await expect(
			load({
				params: { alunoId: '1' }
			} as any)
		).rejects.toThrow();
	});

	it('should handle single student in class', async () => {
		vi.mocked(getStudentById).mockResolvedValue(mockStudent);
		vi.mocked(getStudentEnrollment).mockResolvedValue(mockEnrollment);
		vi.mocked(getStudentsByClass).mockResolvedValue([mockClassStudents[0]]);

		const result = await load({
			params: { alunoId: '1' }
		} as any) as LoadResult;

		expect(result.navigation.previousStudentId).toBeNull();
		expect(result.navigation.nextStudentId).toBeNull();
		expect(result.navigation.currentPosition).toBe(1);
		expect(result.navigation.totalStudents).toBe(1);
	});
});
