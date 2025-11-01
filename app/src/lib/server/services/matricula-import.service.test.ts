import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	parseMatriculaFile,
	normalizeSexo,
	normalizePeriodo,
	parseDate,
	type ParsedMatriculaRow
} from './matricula-import.service';

// Mock XLSX module
const mockXLSX = {
	read: vi.fn(),
	utils: {
		sheet_to_json: vi.fn()
	}
};

vi.mock('xlsx', () => mockXLSX);

describe('MatriculaImportService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('parseMatriculaFile', () => {
		it('should parse a valid Excel file with correct headers', async () => {
			// Mock XLSX responses
			const mockWorkbook = {
				SheetNames: ['Sheet1'],
				Sheets: {
					Sheet1: {}
				}
			};

			const mockHeaders = ['nome_completo', 'data_nascimento', 'sexo', 'escola', 'turma', 'periodo', 'ano_letivo'];
			const mockData = [
				mockHeaders, // Header row
				['João Silva', '15/03/2010', 'M', 'Escola A', 'Turma 1', 'Manhã', '2025'],
				['Maria Santos', '22/07/2011', 'F', 'Escola B', 'Turma 2', 'Tarde', '2025']
			];

			mockXLSX.read.mockReturnValue(mockWorkbook);
			mockXLSX.utils.sheet_to_json.mockReturnValue(mockData);

			const buffer = new ArrayBuffer(1000);
			const result = await parseMatriculaFile(buffer);

			expect(result.data).toHaveLength(2);
			expect(result.errors).toHaveLength(0);
			expect(result.validRows).toBe(2);
			expect(result.totalRows).toBe(2);

			// Check first parsed row
			const firstRow = result.data[0];
			expect(firstRow.nomeCompleto).toBe('João Silva');
			expect(firstRow.dataNascimento).toBe('15/03/2010');
			expect(firstRow.sexo).toBe('M');
			expect(firstRow.escola).toBe('Escola A');
		});

		it('should handle alternative header names', async () => {
			const mockWorkbook = {
				SheetNames: ['Sheet1'],
				Sheets: {
					Sheet1: {}
				}
			};

			const mockHeaders = ['nome', 'nascimento', 'sexo', 'nome_escola', 'turma', 'periodo', 'ano_letivo'];
			const mockData = [
				mockHeaders,
				['João Silva', '15/03/2010', 'M', 'Escola A', 'Turma 1', 'Manhã', '2025']
			];

			mockXLSX.read.mockReturnValue(mockWorkbook);
			mockXLSX.utils.sheet_to_json.mockReturnValue(mockData);

			const buffer = new ArrayBuffer(1000);
			const result = await parseMatriculaFile(buffer);

			expect(result.data[0].nomeCompleto).toBe('João Silva');
			expect(result.data[0].dataNascimento).toBe('15/03/2010');
			expect(result.data[0].escola).toBe('Escola A');
		});

		it('should skip empty rows', async () => {
			const mockWorkbook = {
				SheetNames: ['Sheet1'],
				Sheets: {
					Sheet1: {}
				}
			};

			const mockHeaders = ['nome_completo', 'data_nascimento', 'sexo'];
			const mockData = [
				mockHeaders,
				['João Silva', '15/03/2010', 'M'],
				[null, null, null], // Empty row
				['Maria Santos', '22/07/2011', 'F'],
				['', '', ''] // Another empty row
			];

			mockXLSX.read.mockReturnValue(mockWorkbook);
			mockXLSX.utils.sheet_to_json.mockReturnValue(mockData);

			const buffer = new ArrayBuffer(1000);
			const result = await parseMatriculaFile(buffer);

			expect(result.data).toHaveLength(2); // Only non-empty rows
			expect(result.totalRows).toBe(3); // Excludes header but includes empty rows in count
		});

		it('should report validation errors for invalid data', async () => {
			const mockWorkbook = {
				SheetNames: ['Sheet1'],
				Sheets: {
					Sheet1: {}
				}
			};

			const mockHeaders = ['nome_completo', 'data_nascimento', 'sexo', 'escola', 'turma', 'periodo', 'ano_letivo'];
			const mockData = [
				mockHeaders,
				['', '', '', '', '', '', ''], // Missing required fields
				['João Silva', '32/13/2010', 'X', 'Escola A', 'Turma 1', 'Noite', '1800'], // Invalid date, sexo, periodo, year
				['Maria Santos', '15/03/2010', 'F', 'Escola B', 'Turma 2', 'Tarde', '2025'] // Valid row
			];

			mockXLSX.read.mockReturnValue(mockWorkbook);
			mockXLSX.utils.sheet_to_json.mockReturnValue(mockData);

			const buffer = new ArrayBuffer(1000);
			const result = await parseMatriculaFile(buffer);

			expect(result.data).toHaveLength(1); // Only valid row
			expect(result.errors.length).toBeGreaterThan(0);

			// Check that specific errors were reported
			const errorsByRow = result.errors.reduce((acc, error) => {
				acc[error.row] = acc[error.row] || [];
				acc[error.row].push(error);
				return acc;
			}, {} as Record<number, any[]>);

			// Row 2 should have multiple errors
			expect(errorsByRow[2]).toBeDefined();
			expect(errorsByRow[2].length).toBeGreaterThan(0);
		});

		it('should throw error for empty file', async () => {
			const mockWorkbook = {
				SheetNames: [],
				Sheets: {}
			};

			mockXLSX.read.mockReturnValue(mockWorkbook);

			const buffer = new ArrayBuffer(1000);
			await expect(parseMatriculaFile(buffer)).rejects.toThrow('Arquivo Excel não contém planilhas');
		});

		it('should throw error for file with no headers', async () => {
			const mockWorkbook = {
				SheetNames: ['Sheet1'],
				Sheets: {
					Sheet1: {}
				}
			};

			mockXLSX.read.mockReturnValue(mockWorkbook);
			mockXLSX.utils.sheet_to_json.mockReturnValue([]);

			const buffer = new ArrayBuffer(1000);
			await expect(parseMatriculaFile(buffer)).rejects.toThrow('Planilha está vazia');
		});
	});

	describe('normalizeSexo', () => {
		it('should normalize various sexo inputs correctly', () => {
			expect(normalizeSexo('M')).toBe('Masculino');
			expect(normalizeSexo('m')).toBe('Masculino');
			expect(normalizeSexo('Masculino')).toBe('Masculino');
			expect(normalizeSexo('masculino')).toBe('Masculino');

			expect(normalizeSexo('F')).toBe('Feminino');
			expect(normalizeSexo('f')).toBe('Feminino');
			expect(normalizeSexo('Feminino')).toBe('Feminino');
			expect(normalizeSexo('feminino')).toBe('Feminino');

			expect(normalizeSexo('X')).toBeNull();
			expect(normalizeSexo('')).toBeNull();
			expect(normalizeSexo(undefined)).toBeNull();
		});
	});

	describe('normalizePeriodo', () => {
		it('should normalize various periodo inputs correctly', () => {
			expect(normalizePeriodo('M')).toBe('Manhã');
			expect(normalizePeriodo('m')).toBe('Manhã');
			expect(normalizePeriodo('Manhã')).toBe('Manhã');
			expect(normalizePeriodo('manha')).toBe('Manhã');

			expect(normalizePeriodo('T')).toBe('Tarde');
			expect(normalizePeriodo('t')).toBe('Tarde');
			expect(normalizePeriodo('Tarde')).toBe('Tarde');

			expect(normalizePeriodo('I')).toBe('Integral');
			expect(normalizePeriodo('i')).toBe('Integral');
			expect(normalizePeriodo('Integral')).toBe('Integral');

			expect(normalizePeriodo('N')).toBe('Noite');
			expect(normalizePeriodo('n')).toBe('Noite');
			expect(normalizePeriodo('Noite')).toBe('Noite');

			expect(normalizePeriodo('X')).toBeNull();
			expect(normalizePeriodo('')).toBeNull();
			expect(normalizePeriodo(undefined)).toBeNull();
		});
	});

	describe('parseDate', () => {
		it('should parse valid DD/MM/YYYY dates correctly', () => {
			const result = parseDate('15/03/2010');
			expect(result.getFullYear()).toBe(2010);
			expect(result.getMonth()).toBe(2); // March is 2 (0-indexed)
			expect(result.getDate()).toBe(15);
		});

		it('should handle leap years correctly', () => {
			const result = parseDate('29/02/2020');
			expect(result.getFullYear()).toBe(2020);
			expect(result.getMonth()).toBe(1);
			expect(result.getDate()).toBe(29);
		});

		it('should throw error for invalid dates', () => {
			expect(() => parseDate('32/03/2010')).toThrow();
			expect(() => parseDate('15/13/2010')).toThrow();
			expect(() => parseDate('29/02/2021')).toThrow(); // 2021 is not a leap year
		});
	});
});