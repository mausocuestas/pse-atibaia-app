import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the database BEFORE importing the module
vi.mock('$lib/server/db', () => ({
	sql: vi.fn()
}));

import {
	findOrCreateStudent,
	findOrCreateSchool,
	normalizeClassData,
	createMatricula,
	getSchoolByINEP,
	getAllSchools,
	getStudentById
} from './matricula-import';
import { sql } from '$lib/server/db';

const mockSql = sql as unknown as ReturnType<typeof vi.fn>;

describe('Matricula Import Queries', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('findOrCreateStudent', () => {
		it('should find existing student by CPF', async () => {
			const mockTransaction = vi.fn();
			mockTransaction.mockResolvedValue([{ id: 123 }]);

			const studentData = {
				nomeCompleto: 'João Silva',
				dataNascimento: '15/03/2010',
				cpf: '123.456.789-00'
			};

			const result = await findOrCreateStudent(studentData, mockTransaction);

			expect(result.id).toBe(123);
			expect(result.isNew).toBe(false);
		});

		it('should find existing student by NIS', async () => {
			const mockTransaction = vi.fn();
			mockTransaction
				.mockResolvedValueOnce([]) // CPF not found
				.mockResolvedValueOnce([{ id: 456 }]); // NIS found

			const studentData = {
				nomeCompleto: 'Maria Santos',
				dataNascimento: '22/07/2011',
				nis: '123456789'
			};

			const result = await findOrCreateStudent(studentData, mockTransaction);

			expect(result.id).toBe(456);
			expect(result.isNew).toBe(false);
		});

		it('should create new student when not found', async () => {
			// Create a mock function that acts as a tagged template
			const mockTransaction = Object.assign(
				vi.fn()
					.mockResolvedValueOnce([]) // Name+DOB not found
					.mockResolvedValueOnce([{ id: 789 }]), // New student created
				{ [Symbol.for('postgres.client')]: true } // Mark as postgres client
			);

			const studentData = {
				nomeCompleto: 'Novo Aluno',
				dataNascimento: '10/05/2012',
				sexo: 'Masculino'
				// No CPF/NIS provided
			};

			const result = await findOrCreateStudent(studentData, mockTransaction);

			expect(result.id).toBe(789);
			expect(result.isNew).toBe(true);
		});

		it('should throw error for missing required fields', async () => {
			const studentData = {
				nomeCompleto: '',
				dataNascimento: ''
			};

			await expect(findOrCreateStudent(studentData)).rejects.toThrow('Nome completo e data de nascimento são obrigatórios');
		});
	});

	describe('findOrCreateSchool', () => {
		it('should find existing school by INEP', async () => {
			const mockTransaction = vi.fn();
			mockTransaction.mockResolvedValue([{ inep: 12345678 }]);

			const schoolData = {
				escola: 'Escola Teste',
				inep: '12345678'
			};

			const result = await findOrCreateSchool(schoolData, mockTransaction);

			expect(result.id).toBe(12345678);
			expect(result.isNew).toBe(false);
		});

		it('should find existing school by name', async () => {
			const mockTransaction = Object.assign(
				vi.fn()
					.mockResolvedValueOnce([{ inep: 87654321 }]), // Name found (no INEP provided)
				{ [Symbol.for('postgres.client')]: true }
			);

			const schoolData = {
				escola: 'Escola Existente'
			};

			const result = await findOrCreateSchool(schoolData, mockTransaction);

			expect(result.id).toBe(87654321);
			expect(result.isNew).toBe(false);
		});

		it('should create new school when not found', async () => {
			const mockTransaction = Object.assign(
				vi.fn()
					.mockResolvedValueOnce([]) // Name not found
					.mockResolvedValueOnce([{ max_inep: 35000000 }]) // generateNextINEP query
					.mockResolvedValueOnce([{ inep: 35000001 }]), // New school created
				{ [Symbol.for('postgres.client')]: true }
			);

			const schoolData = {
				escola: 'Nova Escola'
			};

			const result = await findOrCreateSchool(schoolData, mockTransaction);

			expect(result.id).toBe(35000001);
			expect(result.isNew).toBe(true);
		});

		it('should throw error for missing school name', async () => {
			const schoolData = {};

			await expect(findOrCreateSchool(schoolData)).rejects.toThrow('Nome da escola é obrigatório');
		});
	});

	describe('normalizeClassData', () => {
		it('should normalize valid class data', () => {
			const classData = {
				turma: 'Turma A',
				periodo: 'Manhã'
			};

			const result = normalizeClassData(classData);

			expect(result.turma).toBe('Turma A');
			expect(result.periodo).toBe('Manhã');
		});

		it('should normalize periodo variations', () => {
			const classData = {
				turma: 'Turma B',
				periodo: 'manha'
			};

			const result = normalizeClassData(classData);

			expect(result.periodo).toBe('Manhã');
		});

		it('should throw error for invalid periodo', () => {
			const classData = {
				turma: 'Turma A',
				periodo: 'Invalido'
			};

			expect(() => normalizeClassData(classData)).toThrow('Período inválido: Invalido');
		});

		it('should throw error for incomplete data', () => {
			const classData: any = {
				turma: 'Turma A'
			};

			expect(() => normalizeClassData(classData)).toThrow('Dados da turma incompletos');
		});
	});

	describe('createMatricula', () => {
		it('should create new matricula', async () => {
			const mockTransaction = vi.fn();
			mockTransaction
				.mockResolvedValueOnce([]) // No existing matricula
				.mockResolvedValueOnce([{ id: 333 }]); // New matricula created

			const matriculaData = {
				alunoId: 123,
				escolaId: 456,
				turma: 'Turma A',
				periodo: 'Manhã',
				anoLetivo: 2025
			};

			const result = await createMatricula(matriculaData, mockTransaction);

			expect(result.id).toBe(333);
			expect(result.isNew).toBe(true);
		});

		it('should update existing matricula if found', async () => {
			const mockTransaction = vi.fn();
			mockTransaction
				.mockResolvedValueOnce([{ id: 444 }]) // Existing matricula found
				.mockResolvedValueOnce([{ id: 444 }]); // Update returns id

			const matriculaData = {
				alunoId: 123,
				escolaId: 456,
				turma: 'Turma B',
				periodo: 'Tarde',
				anoLetivo: 2025
			};

			const result = await createMatricula(matriculaData, mockTransaction);

			expect(result.id).toBe(444);
			expect(result.isNew).toBe(false);
		});
	});

	describe('getSchoolByINEP', () => {
		it('should return school when found', async () => {
			mockSql.mockResolvedValue([{ inep: 12345, escola: 'Escola Teste' }]);

			const result = await getSchoolByINEP(12345);

			expect(result).toEqual({ inep: 12345, escola: 'Escola Teste' });
		});

		it('should return null when school not found', async () => {
			mockSql.mockResolvedValue([]);

			const result = await getSchoolByINEP(99999);

			expect(result).toBeNull();
		});
	});

	describe('getAllSchools', () => {
		it('should return list of schools', async () => {
			mockSql.mockResolvedValue([
				{ inep: 12345, escola: 'Escola A' },
				{ inep: 67890, escola: 'Escola B' }
			]);

			const result = await getAllSchools();

			expect(result).toHaveLength(2);
			expect(result[0]).toEqual({ inep: 12345, escola: 'Escola A' });
		});
	});

	describe('getStudentById', () => {
		it('should return student when found', async () => {
			mockSql.mockResolvedValue([{
				id: 123,
				cliente: 'João Silva',
				data_nasc: new Date('2010-03-15'),
				sexo: 'Masculino',
				cpf: '123.456.789-00',
				nis: '123456789'
			}]);

			const result = await getStudentById(123);

			expect(result).toEqual({
				id: 123,
				cliente: 'João Silva',
				data_nasc: new Date('2010-03-15'),
				sexo: 'Masculino',
				cpf: '123.456.789-00',
				nis: '123456789'
			});
		});

		it('should return null when student not found', async () => {
			mockSql.mockResolvedValue([]);

			const result = await getStudentById(999);

			expect(result).toBeNull();
		});
	});
});