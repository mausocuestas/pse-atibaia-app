import * as XLSX from 'xlsx';
import { z } from 'zod';

// Define the schema for a row in the Excel file
const MatriculaRowSchema = z.object({
	nome_completo: z.string().optional().transform(val => val || undefined),
	nome: z.string().optional().transform(val => val || undefined),
	data_nascimento: z.string().optional().transform(val => val || undefined),
	nascimento: z.string().optional().transform(val => val || undefined),
	sexo: z.string().optional().transform(val => val || undefined),
	cpf: z.string().optional().transform(val => val || undefined),
	nis: z.string().optional().transform(val => val || undefined),
	escola: z.string().optional().transform(val => val || undefined),
	nome_escola: z.string().optional().transform(val => val || undefined),
	inep: z.string().optional().transform(val => val || undefined),
	turma: z.string().optional().transform(val => val || undefined),
	periodo: z.string().optional().transform(val => val || undefined),
	ano_letivo: z.union([z.string(), z.number()]).optional().transform(val => val || undefined)
}).transform(data => {
	// Normalize field names
	return {
		nomeCompleto: data.nome_completo || data.nome,
		dataNascimento: data.data_nascimento || data.nascimento,
		sexo: data.sexo,
		cpf: data.cpf,
		nis: data.nis,
		escola: data.escola || data.nome_escola,
		inep: data.inep,
		turma: data.turma,
		periodo: data.periodo,
		anoLetivo: data.ano_letivo
	};
});

export interface ParsedMatriculaRow {
	rowNumber: number;
	nomeCompleto?: string;
	dataNascimento?: string;
	sexo?: string;
	cpf?: string;
	nis?: string;
	escola?: string;
	inep?: string;
	turma?: string;
	periodo?: string;
	anoLetivo?: string | number;
}

export interface ValidationError {
	row: number;
	field: string;
	message: string;
	value: any;
}

export interface ParseResult {
	data: ParsedMatriculaRow[];
	errors: ValidationError[];
	totalRows: number;
	validRows: number;
}

/**
 * Parses an Excel file buffer and extracts matricula data
 */
export async function parseMatriculaFile(buffer: ArrayBuffer): Promise<ParseResult> {
	const errors: ValidationError[] = [];
	const data: ParsedMatriculaRow[] = [];

	try {
		// Parse the workbook
		const workbook = XLSX.read(buffer, { type: 'buffer' });

		// Get the first worksheet
		const sheetName = workbook.SheetNames[0];
		if (!sheetName) {
			throw new Error('Arquivo Excel não contém planilhas');
		}

		const worksheet = workbook.Sheets[sheetName];

		// Convert to JSON with raw values
		const jsonData = XLSX.utils.sheet_to_json(worksheet, {
			header: 1,
			raw: false,
			defval: null
		});

		if (jsonData.length === 0) {
			throw new Error('Planilha está vazia');
		}

		// Extract headers (first row)
		const headers = jsonData[0] as string[];
		if (!headers || headers.length === 0) {
			throw new Error('Cabeçalhos não encontrados na primeira linha');
		}

		// Normalize headers to lowercase and remove special characters
		const normalizedHeaders = headers.map(header =>
			header ? header.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '') : ''
		);

		// Process data rows (skip header row)
		for (let i = 1; i < jsonData.length; i++) {
			const row = jsonData[i] as any[];
			const rowNumber = i + 1; // Excel row numbers start at 1

			// Skip empty rows
			if (!row || row.every(cell => cell === null || cell === '')) {
				continue;
			}

			// Create row object with normalized headers
			const rowObj: any = {};
			normalizedHeaders.forEach((header, index) => {
				if (header) {
					rowObj[header.replace(/[^a-z0-9_]/g, '_')] = row[index];
				}
			});

			try {
				// Validate and transform the row data
				const validatedRow = MatriculaRowSchema.parse(rowObj);

				// Additional validation
				const validationErrors = validateRowData(validatedRow, rowNumber);
				if (validationErrors.length > 0) {
					errors.push(...validationErrors);
					continue;
				}

				// Add row number for error tracking
				data.push({
					rowNumber,
					...validatedRow
				});

			} catch (error) {
				if (error instanceof z.ZodError) {
					error.issues.forEach(zodError => {
						errors.push({
							row: rowNumber,
							field: zodError.path.join('.'),
							message: zodError.message,
							value: (zodError as any).received
						});
					});
				} else {
					errors.push({
						row: rowNumber,
						field: 'general',
						message: error instanceof Error ? error.message : 'Erro desconhecido',
						value: rowObj
					});
				}
			}
		}

		return {
			data,
			errors,
			totalRows: jsonData.length - 1, // Exclude header row
			validRows: data.length
		};

	} catch (error) {
		console.error('Error parsing Excel file:', error);
		throw new Error(`Falha ao processar arquivo Excel: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
	}
}

/**
 * Validates individual row data beyond schema validation
 */
function validateRowData(row: any, rowNumber: number): ValidationError[] {
	const errors: ValidationError[] = [];

	// Required fields validation
	if (!row.nomeCompleto || row.nomeCompleto.trim() === '') {
		errors.push({
			row: rowNumber,
			field: 'nomeCompleto',
			message: 'Nome completo é obrigatório',
			value: row.nomeCompleto
		});
	}

	if (!row.dataNascimento || row.dataNascimento.trim() === '') {
		errors.push({
			row: rowNumber,
			field: 'dataNascimento',
			message: 'Data de nascimento é obrigatória',
			value: row.dataNascimento
		});
	} else {
		// Validate date format
		if (!isValidDate(row.dataNascimento)) {
			errors.push({
				row: rowNumber,
				field: 'dataNascimento',
				message: 'Data de nascimento inválida. Use o formato DD/MM/YYYY',
				value: row.dataNascimento
			});
		}
	}

	if (!row.escola || row.escola.trim() === '') {
		errors.push({
			row: rowNumber,
			field: 'escola',
			message: 'Nome da escola é obrigatório',
			value: row.escola
		});
	}

	if (!row.turma || row.turma.trim() === '') {
		errors.push({
			row: rowNumber,
			field: 'turma',
			message: 'Nome da turma é obrigatório',
			value: row.turma
		});
	}

	if (!row.periodo || row.periodo.trim() === '') {
		errors.push({
			row: rowNumber,
			field: 'periodo',
			message: 'Período é obrigatório',
			value: row.periodo
		});
	} else {
		// Validate periodo values
		const validPeriodos = ['manhã', 'tarde', 'integral', 'noite', 'm', 't', 'i', 'n'];
		const normalizedPeriodo = row.periodo.toLowerCase().trim();
		if (!validPeriodos.includes(normalizedPeriodo)) {
			errors.push({
				row: rowNumber,
				field: 'periodo',
				message: 'Período inválido. Use: Manhã, Tarde, Integral ou Noite',
				value: row.periodo
			});
		}
	}

	if (!row.anoLetivo) {
		errors.push({
			row: rowNumber,
			field: 'anoLetivo',
			message: 'Ano letivo é obrigatório',
			value: row.anoLetivo
		});
	} else {
		// Validate year
		const year = parseInt(String(row.anoLetivo));
		const currentYear = new Date().getFullYear();
		if (isNaN(year) || year < 2000 || year > currentYear + 1) {
			errors.push({
				row: rowNumber,
				field: 'anoLetivo',
				message: `Ano letivo inválido. Use um ano entre 2000 e ${currentYear + 1}`,
				value: row.anoLetivo
			});
		}
	}

	// Optional field validation
	if (row.sexo) {
		const validSexos = ['m', 'f', 'masculino', 'feminino'];
		const normalizedSexo = row.sexo.toLowerCase().trim();
		if (!validSexos.includes(normalizedSexo)) {
			errors.push({
				row: rowNumber,
				field: 'sexo',
				message: 'Sexo inválido. Use: M, F, Masculino ou Feminino',
				value: row.sexo
			});
		}
	}

	if (row.cpf && !isValidCPF(row.cpf)) {
		errors.push({
			row: rowNumber,
			field: 'cpf',
			message: 'CPF inválido',
			value: row.cpf
		});
	}

	return errors;
}

/**
 * Validates if a date string is in DD/MM/YYYY format
 */
function isValidDate(dateString: string): boolean {
	// DD/MM/YYYY format
	const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
	if (!dateRegex.test(dateString)) {
		return false;
	}

	const [, day, month, year] = dateString.match(dateRegex) || [];
	const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

	return (
		date.getDate() === parseInt(day) &&
		date.getMonth() === parseInt(month) - 1 &&
		date.getFullYear() === parseInt(year)
	);
}

/**
 * Basic CPF validation (digits only, correct length)
 */
function isValidCPF(cpf: string): boolean {
	// Remove non-numeric characters
	const cleanCPF = cpf.replace(/\D/g, '');

	// Must have 11 digits
	if (cleanCPF.length !== 11) {
		return false;
	}

	// Cannot be all the same digit
	if (/^(\d)\1{10}$/.test(cleanCPF)) {
		return false;
	}

	// Basic validation algorithm (simplified)
	let sum = 0;
	let remainder;

	for (let i = 1; i <= 9; i++) {
		sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
	}

	remainder = (sum * 10) % 11;
	if (remainder === 10 || remainder === 11) {
		remainder = 0;
	}

	if (remainder !== parseInt(cleanCPF.substring(9, 10))) {
		return false;
	}

	sum = 0;
	for (let i = 1; i <= 10; i++) {
		sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
	}

	remainder = (sum * 10) % 11;
	if (remainder === 10 || remainder === 11) {
		remainder = 0;
	}

	if (remainder !== parseInt(cleanCPF.substring(10, 11))) {
		return false;
	}

	return true;
}

/**
 * Normalizes sexo field to standard values
 */
export function normalizeSexo(sexo?: string): 'Masculino' | 'Feminino' | null {
	if (!sexo) return null;

	const normalized = sexo.toLowerCase().trim();
	if (['m', 'masculino'].includes(normalized)) {
		return 'Masculino';
	}
	if (['f', 'feminino'].includes(normalized)) {
		return 'Feminino';
	}
	return null;
}

/**
 * Normalizes periodo field to standard values
 */
export function normalizePeriodo(periodo?: string): 'Manhã' | 'Tarde' | 'Integral' | 'Noite' | null {
	if (!periodo) return null;

	const normalized = periodo.toLowerCase().trim();
	switch (normalized) {
		case 'm':
		case 'manhã':
		case 'manha':
			return 'Manhã';
		case 't':
		case 'tarde':
			return 'Tarde';
		case 'i':
		case 'integral':
			return 'Integral';
		case 'n':
		case 'noite':
			return 'Noite';
		default:
			return null;
	}
}

/**
 * Parses date string from DD/MM/YYYY to Date object
 */
export function parseDate(dateString: string): Date {
	const [day, month, year] = dateString.split('/').map(Number);
	return new Date(year, month - 1, day);
}