import { describe, it, expect } from 'vitest';
import {
	calculateBMI,
	calculateCDCClassification,
	getClassificationColorVariant,
	type CDCClassification
} from './cdc-classification';

describe('calculateBMI', () => {
	it('should calculate BMI correctly for typical values', () => {
		// Example: 30 kg, 140 cm → BMI = 30 / (1.4^2) = 15.31
		const bmi = calculateBMI(30, 140);
		expect(bmi).toBe(15.31);
	});

	it('should calculate BMI correctly for another set of values', () => {
		// Example: 50 kg, 160 cm → BMI = 50 / (1.6^2) = 19.53
		const bmi = calculateBMI(50, 160);
		expect(bmi).toBe(19.53);
	});

	it('should round BMI to 2 decimal places', () => {
		// Example: 35.5 kg, 145 cm → BMI = 35.5 / (1.45^2) = 16.88...
		const bmi = calculateBMI(35.5, 145);
		expect(bmi).toBeCloseTo(16.88, 2);
	});

	it('should throw error for zero height', () => {
		expect(() => calculateBMI(30, 0)).toThrow('Height must be greater than zero');
	});

	it('should throw error for negative height', () => {
		expect(() => calculateBMI(30, -10)).toThrow('Height must be greater than zero');
	});

	it('should throw error for zero weight', () => {
		expect(() => calculateBMI(0, 140)).toThrow('Weight must be greater than zero');
	});

	it('should throw error for negative weight', () => {
		expect(() => calculateBMI(-5, 140)).toThrow('Weight must be greater than zero');
	});
});

describe('calculateCDCClassification', () => {
	describe('Age group 5-9 years', () => {
		const age = 7;
		const sex = 'M';

		it('should classify as Abaixo do Peso for BMI < 13.5', () => {
			const classification = calculateCDCClassification(13.0, age, sex);
			expect(classification).toBe('Abaixo do Peso');
		});

		it('should classify as Peso Normal for BMI 13.5-17.5', () => {
			let classification = calculateCDCClassification(13.5, age, sex);
			expect(classification).toBe('Peso Normal');

			classification = calculateCDCClassification(15.5, age, sex);
			expect(classification).toBe('Peso Normal');

			classification = calculateCDCClassification(17.4, age, sex);
			expect(classification).toBe('Peso Normal');
		});

		it('should classify as Sobrepeso for BMI 17.5-19.5', () => {
			let classification = calculateCDCClassification(17.5, age, sex);
			expect(classification).toBe('Sobrepeso');

			classification = calculateCDCClassification(18.5, age, sex);
			expect(classification).toBe('Sobrepeso');

			classification = calculateCDCClassification(19.4, age, sex);
			expect(classification).toBe('Sobrepeso');
		});

		it('should classify as Obesidade for BMI >= 19.5', () => {
			let classification = calculateCDCClassification(19.5, age, sex);
			expect(classification).toBe('Obesidade');

			classification = calculateCDCClassification(25.0, age, sex);
			expect(classification).toBe('Obesidade');
		});
	});

	describe('Age group 10-14 years', () => {
		const age = 12;
		const sex = 'F';

		it('should classify as Abaixo do Peso for BMI < 14.5', () => {
			const classification = calculateCDCClassification(14.0, age, sex);
			expect(classification).toBe('Abaixo do Peso');
		});

		it('should classify as Peso Normal for BMI 14.5-21.0', () => {
			let classification = calculateCDCClassification(14.5, age, sex);
			expect(classification).toBe('Peso Normal');

			classification = calculateCDCClassification(18.0, age, sex);
			expect(classification).toBe('Peso Normal');

			classification = calculateCDCClassification(20.9, age, sex);
			expect(classification).toBe('Peso Normal');
		});

		it('should classify as Sobrepeso for BMI 21.0-25.0', () => {
			let classification = calculateCDCClassification(21.0, age, sex);
			expect(classification).toBe('Sobrepeso');

			classification = calculateCDCClassification(23.0, age, sex);
			expect(classification).toBe('Sobrepeso');

			classification = calculateCDCClassification(24.9, age, sex);
			expect(classification).toBe('Sobrepeso');
		});

		it('should classify as Obesidade for BMI >= 25.0', () => {
			let classification = calculateCDCClassification(25.0, age, sex);
			expect(classification).toBe('Obesidade');

			classification = calculateCDCClassification(30.0, age, sex);
			expect(classification).toBe('Obesidade');
		});
	});

	describe('Age group 15-19 years', () => {
		const age = 17;
		const sex = 'M';

		it('should classify as Abaixo do Peso for BMI < 16.0', () => {
			const classification = calculateCDCClassification(15.5, age, sex);
			expect(classification).toBe('Abaixo do Peso');
		});

		it('should classify as Peso Normal for BMI 16.0-24.0', () => {
			let classification = calculateCDCClassification(16.0, age, sex);
			expect(classification).toBe('Peso Normal');

			classification = calculateCDCClassification(20.0, age, sex);
			expect(classification).toBe('Peso Normal');

			classification = calculateCDCClassification(23.9, age, sex);
			expect(classification).toBe('Peso Normal');
		});

		it('should classify as Sobrepeso for BMI 24.0-29.0', () => {
			let classification = calculateCDCClassification(24.0, age, sex);
			expect(classification).toBe('Sobrepeso');

			classification = calculateCDCClassification(26.5, age, sex);
			expect(classification).toBe('Sobrepeso');

			classification = calculateCDCClassification(28.9, age, sex);
			expect(classification).toBe('Sobrepeso');
		});

		it('should classify as Obesidade for BMI >= 29.0', () => {
			let classification = calculateCDCClassification(29.0, age, sex);
			expect(classification).toBe('Obesidade');

			classification = calculateCDCClassification(35.0, age, sex);
			expect(classification).toBe('Obesidade');
		});
	});

	describe('Edge cases - ages outside range', () => {
		it('should use fallback for age < 5 years', () => {
			// Should use 10-14 age group thresholds as fallback
			const classification = calculateCDCClassification(15.0, 4, 'M');
			expect(classification).toBeDefined();
		});

		it('should use fallback for age > 19 years', () => {
			// Should use 10-14 age group thresholds as fallback
			const classification = calculateCDCClassification(20.0, 21, 'F');
			expect(classification).toBeDefined();
		});
	});

	describe('Sex parameter', () => {
		it('should accept M (male) sex', () => {
			const classification = calculateCDCClassification(16.0, 7, 'M');
			expect(classification).toBe('Peso Normal');
		});

		it('should accept F (female) sex', () => {
			const classification = calculateCDCClassification(16.0, 7, 'F');
			expect(classification).toBe('Peso Normal');
		});

		// Note: Current implementation doesn't use sex parameter
		// This is documented in the code as a future enhancement
	});
});

describe('getClassificationColorVariant', () => {
	it('should return "default" for Peso Normal', () => {
		const variant = getClassificationColorVariant('Peso Normal');
		expect(variant).toBe('default');
	});

	it('should return "destructive" for Abaixo do Peso', () => {
		const variant = getClassificationColorVariant('Abaixo do Peso');
		expect(variant).toBe('destructive');
	});

	it('should return "secondary" for Sobrepeso', () => {
		const variant = getClassificationColorVariant('Sobrepeso');
		expect(variant).toBe('secondary');
	});

	it('should return "destructive" for Obesidade', () => {
		const variant = getClassificationColorVariant('Obesidade');
		expect(variant).toBe('destructive');
	});
});
