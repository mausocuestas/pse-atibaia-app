/**
 * CDC (Centers for Disease Control and Prevention) BMI Classification Utilities
 *
 * This module provides functions to calculate BMI and classify weight status
 * for children and adolescents based on simplified CDC BMI-for-age thresholds.
 *
 * IMPORTANT: This implementation uses a simplified threshold-based approach
 * rather than the full CDC percentile calculation. For production use with
 * clinical requirements, consider implementing full CDC BMI-for-age percentile
 * tables or integrating with WHO growth reference data.
 *
 * References:
 * - CDC BMI Calculator: https://www.cdc.gov/healthyweight/bmi/calculator.html
 * - CDC BMI-for-Age Charts: https://www.cdc.gov/growthcharts/clinical_charts.htm
 */

/**
 * CDC Classification categories based on BMI percentiles
 */
export type CDCClassification =
	| 'Abaixo do Peso' // Underweight: BMI < 5th percentile
	| 'Peso Normal' // Healthy Weight: BMI 5th to < 85th percentile
	| 'Sobrepeso' // Overweight: BMI 85th to < 95th percentile
	| 'Obesidade'; // Obese: BMI ≥ 95th percentile

/**
 * Simplified BMI thresholds by age group
 * These are approximations based on common BMI ranges for school-age children
 *
 * TODO: Replace with full CDC BMI-for-age percentile tables for accurate classification
 */
interface BMIThresholds {
	underweight: number; // < 5th percentile
	normal: number; // 5th to < 85th percentile (upper bound)
	overweight: number; // 85th to < 95th percentile (upper bound)
	// obese: anything >= overweight threshold
}

const AGE_GROUP_THRESHOLDS: Record<string, BMIThresholds> = {
	'5-9': {
		underweight: 13.5,
		normal: 17.5,
		overweight: 19.5
	},
	'10-14': {
		underweight: 14.5,
		normal: 21.0,
		overweight: 25.0
	},
	'15-19': {
		underweight: 16.0,
		normal: 24.0,
		overweight: 29.0
	}
};

/**
 * Calculates Body Mass Index (BMI) from weight and height
 *
 * BMI = weight (kg) / [height (m)]²
 *
 * @param weightKg - Weight in kilograms
 * @param heightCm - Height in centimeters
 * @returns Calculated BMI rounded to 2 decimal places
 * @throws Error if height is zero or negative
 *
 * @example
 * calculateBMI(30, 140) // Returns 15.31
 */
export function calculateBMI(weightKg: number, heightCm: number): number {
	// Validate inputs
	if (heightCm <= 0) {
		throw new Error('Height must be greater than zero');
	}
	if (weightKg <= 0) {
		throw new Error('Weight must be greater than zero');
	}

	// Convert height from cm to meters
	const heightM = heightCm / 100;

	// Calculate BMI
	const bmi = weightKg / (heightM * heightM);

	// Round to 2 decimal places
	return Math.round(bmi * 100) / 100;
}

/**
 * Gets the appropriate BMI thresholds for a given age
 *
 * @param ageYears - Age in years
 * @returns BMI thresholds for the age group, or null if age is out of range
 */
function getThresholdsForAge(ageYears: number): BMIThresholds | null {
	if (ageYears >= 5 && ageYears <= 9) {
		return AGE_GROUP_THRESHOLDS['5-9'];
	} else if (ageYears >= 10 && ageYears <= 14) {
		return AGE_GROUP_THRESHOLDS['10-14'];
	} else if (ageYears >= 15 && ageYears <= 19) {
		return AGE_GROUP_THRESHOLDS['15-19'];
	}
	return null;
}

/**
 * Calculates CDC weight status classification based on BMI, age, and sex
 *
 * This is a SIMPLIFIED implementation using age-group-based thresholds.
 * The full CDC classification uses BMI-for-age percentile tables that
 * account for sex differences and provide more granular age-based classifications.
 *
 * @param bmi - Body Mass Index
 * @param ageYears - Age in years (5-19 years range supported)
 * @param sex - Student sex ('M' or 'F') - currently not used in simplified version
 * @returns CDC classification category
 *
 * @example
 * calculateCDCClassification(15.31, 7, 'M') // Returns 'Peso Normal'
 * calculateCDCClassification(26.0, 12, 'F') // Returns 'Obesidade'
 */
export function calculateCDCClassification(
	bmi: number,
	ageYears: number,
	sex: string
): CDCClassification {
	// Get thresholds for age group
	const thresholds = getThresholdsForAge(ageYears);

	// If age is out of supported range, use middle age group as fallback
	if (!thresholds) {
		console.warn(
			`Age ${ageYears} is outside supported range (5-19 years). Using 10-14 age group thresholds.`
		);
		return calculateCDCClassification(bmi, 12, sex); // Use middle age group
	}

	// Classify based on BMI thresholds
	if (bmi < thresholds.underweight) {
		return 'Abaixo do Peso';
	} else if (bmi < thresholds.normal) {
		return 'Peso Normal';
	} else if (bmi < thresholds.overweight) {
		return 'Sobrepeso';
	} else {
		return 'Obesidade';
	}

	// NOTE: Sex parameter is not currently used in this simplified implementation
	// In a full CDC implementation, sex-specific percentile tables would be used
	// TODO: Implement sex-specific BMI-for-age percentile calculations
}

/**
 * Gets a color variant for displaying CDC classification
 * Useful for Badge components or color-coded UI elements
 *
 * @param classification - CDC classification category
 * @returns Color variant string for UI components
 */
export function getClassificationColorVariant(
	classification: CDCClassification
): 'default' | 'secondary' | 'destructive' | 'outline' {
	switch (classification) {
		case 'Peso Normal':
			return 'default'; // Green/primary color
		case 'Abaixo do Peso':
			return 'destructive'; // Red/warning color
		case 'Sobrepeso':
			return 'secondary'; // Yellow/warning color
		case 'Obesidade':
			return 'destructive'; // Red/critical color
		default:
			return 'outline';
	}
}
