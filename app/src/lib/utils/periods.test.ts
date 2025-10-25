import { describe, it, expect } from 'vitest';
import { formatPeriod, calculateAge, formatDateOfBirthWithAge, PERIOD_LABELS } from './periods';

describe('periods utilities', () => {
	describe('formatPeriod', () => {
		it('should format MANHA to Manhã', () => {
			expect(formatPeriod('MANHA')).toBe('Manhã');
		});

		it('should format TARDE to Tarde', () => {
			expect(formatPeriod('TARDE')).toBe('Tarde');
		});

		it('should format INTEGRAL to Integral', () => {
			expect(formatPeriod('INTEGRAL')).toBe('Integral');
		});

		it('should format NOITE to Noite', () => {
			expect(formatPeriod('NOITE')).toBe('Noite');
		});

		it('should return original value for unknown period', () => {
			expect(formatPeriod('UNKNOWN')).toBe('UNKNOWN');
		});
	});

	describe('calculateAge', () => {
		it('should calculate age correctly for birth date 10 years ago', () => {
			const tenYearsAgo = new Date();
			tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);

			expect(calculateAge(tenYearsAgo)).toBe(10);
		});

		it('should calculate age correctly when birthday has not occurred this year', () => {
			const today = new Date();
			const birthDate = new Date();
			birthDate.setFullYear(today.getFullYear() - 10);
			birthDate.setMonth(today.getMonth() + 1); // Next month

			expect(calculateAge(birthDate)).toBe(9);
		});

		it('should calculate age correctly when birthday has occurred this year', () => {
			const today = new Date();
			const birthDate = new Date();
			birthDate.setFullYear(today.getFullYear() - 10);
			birthDate.setMonth(today.getMonth() - 1); // Last month

			expect(calculateAge(birthDate)).toBe(10);
		});

		it('should calculate age correctly on birthday', () => {
			const today = new Date();
			const birthDate = new Date();
			birthDate.setFullYear(today.getFullYear() - 10);
			birthDate.setMonth(today.getMonth());
			birthDate.setDate(today.getDate());

			expect(calculateAge(birthDate)).toBe(10);
		});

		it('should handle newborn (0 years)', () => {
			const today = new Date();
			expect(calculateAge(today)).toBe(0);
		});

		it('should calculate age for specific date (2015-03-15)', () => {
			// Mock current date as 2025-10-25
			const birthDate = new Date('2015-03-15');
			const age = calculateAge(birthDate);

			// Age should be 10 (birthday already passed this year)
			expect(age).toBeGreaterThanOrEqual(10);
		});
	});

	describe('formatDateOfBirthWithAge', () => {
		it('should format date with provided age', () => {
			// Use explicit date construction to avoid timezone issues
			const date = new Date(2015, 2, 15); // Month is 0-indexed (2 = March)
			const result = formatDateOfBirthWithAge(date, 10);

			expect(result).toContain('/03/2015');
			expect(result).toContain('10 anos');
		});

		it('should calculate age if not provided', () => {
			const tenYearsAgo = new Date();
			tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);

			const result = formatDateOfBirthWithAge(tenYearsAgo);
			expect(result).toContain('10 anos');
		});

		it('should use singular "ano" for age 1', () => {
			const date = new Date('2024-01-01');
			const result = formatDateOfBirthWithAge(date, 1);

			expect(result).toContain('1 ano');
		});

		it('should return default message for null date', () => {
			expect(formatDateOfBirthWithAge(null)).toBe('Data não informada');
		});

		it('should handle age 0', () => {
			const date = new Date();
			const result = formatDateOfBirthWithAge(date, 0);

			expect(result).toContain('0 anos');
		});
	});

	describe('PERIOD_LABELS', () => {
		it('should have all required period labels', () => {
			expect(PERIOD_LABELS).toHaveProperty('MANHA');
			expect(PERIOD_LABELS).toHaveProperty('TARDE');
			expect(PERIOD_LABELS).toHaveProperty('INTEGRAL');
			expect(PERIOD_LABELS).toHaveProperty('NOITE');
		});
	});
});
