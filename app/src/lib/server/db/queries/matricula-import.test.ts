import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	findOrCreateStudent,
	findOrCreateSchool,
	findOrCreateClass,
	createMatricula,
	getSchoolByINEP,
	getAllSchools,
	getStudentById
} from './matricula-import';

// Mock the database inline
const mockSql = vi.fn();
vi.mock('$lib/server/db', () => ({
	sql: mockSql
}));

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
			const mockTransaction = vi.fn();
			mockTransaction
				.mockResolvedValueOnce([]) // CPF not found
				.mockResolvedValueOnce([]) // NIS not found
				.mockResolvedValueOnce([]) // Name+DOB not found
				.mockResolvedValueOnce([{ id: 789 }]); // New student created

			const studentData = {
				nomeCompleto: 'Novo Aluno',
				dataNascimento: '10/05/2012'
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
			const mockTransaction = vi.fn();
			mockTransaction
				.mockResolvedValueOnce([]) // INEP not found
				.mockResolvedValueOnce([{ inep: 87654321 }]); // Name found

			const schoolData = {
				escola: 'Escola Existente'
			};

			const result = await findOrCreateSchool(schoolData, mockTransaction);

			expect(result.id).toBe(87654321);
			expect(result.isNew).toBe(false);
		});

		it('should create new school when not found', async () => {
			const mockTransaction = vi.fn();
			mockTransaction
				.mockResolvedValueOnce([]) // INEP not found
				.mockResolvedValueOnce([]) // Name not found
				.mockResolvedValueOnce([{ inep: 99999999 }]); // New school created

			const schoolData = {
				escola: 'Nova Escola'
			};

			const result = await findOrCreateSchool(schoolData, mockTransaction);

			expect(result.id).toBe(99999999);
			expect(result.isNew).toBe(true);
		});

		it('should throw error for missing school name', async () => {
			const schoolData = {};

			await expect(findOrCreateSchool(schoolData)).rejects.toThrow('Nome da escola é obrigatório');
		});
	});

	describe('findOrCreateClass', () => {
		it('should find existing class', async () => {
			const mockTransaction = vi.fn();
			mockTransaction.mockResolvedValue([{ id: 111 }]);

			const classData = {
				turma: 'Turma A',
				periodo: 'Manhã',
				escolaId: 123,
				anoLetivo: 2025
			};

			const result = await findOrCreateClass(classData, mockTransaction);

			expect(result.id).toBe(111);
			expect(result.isNew).toBe(false);
		});

		it('should create new class when not found', async () => {
			const mockTransaction = vi.fn();
			mockTransaction
				.mockResolvedValueOnce([]) // Class not found
				.mockResolvedValueOnce([{ id: 222 }]); // New class created

			const classData = {
				turma: 'Nova Turma',
				periodo: 'Tarde',
				escolaId: 456,
				anoLetivo: 2025
			};

			const result = await findOrCreateClass(classData, mockTransaction);

			expect(result.id).toBe(222);
			expect(result.isNew).toBe(true);
		});

		it('should throw error for invalid periodo', async () => {
			const classData = {
				turma: 'Turma A',
				periodo: 'Invalido',
				escolaId: 123,
				anoLetivo: 2025
			};

			await expect(findOrCreateClass(classData)).rejects.toThrow('Período inválido: Invalido');
		});

		it('should throw error for incomplete data', async () => {
			const classData: any = {
				turma: 'Turma A'
			};

			await expect(findOrCreateClass(classData)).rejects.toThrow('Dados da turma incompletos');
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
				turmaId: 456,
				anoLetivo: 2025
			};

			const result = await createMatricula(matriculaData, mockTransaction);

			expect(result.id).toBe(333);
		});

		it('should return existing matricula if found', async () => {
			const mockTransaction = vi.fn();
			mockTransaction.mockResolvedValue([{ id: 444 }]); // Existing matricula found

			const matriculaData = {
				alunoId: 123,
				turmaId: 456,
				anoLetivo: 2025
			};

			const result = await createMatricula(matriculaData, mockTransaction);

			expect(result.id).toBe(444);
		});
	});

	describe('getSchoolByINEP', () => {
		it('should return school when found', async () => {
			mockDb.sql.mockResolvedValue([{ inep: 12345, escola: 'Escola Teste' }]);

			const result = await getSchoolByINEP(12345);

			expect(result).toEqual({ inep: 12345, escola: 'Escola Teste' });
		});

		it('should return null when school not found', async () => {
			mockDb.sql.mockResolvedValue([]);

			const result = await getSchoolByINEP(99999);

			expect(result).toBeNull();
		});
	});

	describe('getAllSchools', () => {
		it('should return list of schools', async () => {
			mockDb.sql.mockResolvedValue([
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
			mockDb.sql.mockResolvedValue([{
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
			mockDb.sql.mockResolvedValue([]);

			const result = await getStudentById(999);

			expect(result).toBeNull();
		});
	});
});