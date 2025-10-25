/**
 * Period display utilities
 *
 * Database stores periods without accents (MANHA, TARDE, INTEGRAL, NOITE)
 * but we want to display them with proper Portuguese formatting
 */

/**
 * Map of period values (DB format) to display labels (with accents)
 */
export const PERIOD_LABELS: Record<string, string> = {
	MANHA: 'Manhã',
	TARDE: 'Tarde',
	INTEGRAL: 'Integral',
	NOITE: 'Noite'
};

/**
 * Formats a period value from database format to display format
 * @param periodo - Period value from database (e.g., "MANHA")
 * @returns Formatted period label (e.g., "Manhã")
 */
export function formatPeriod(periodo: string): string {
	return PERIOD_LABELS[periodo] || periodo;
}

/**
 * Calculates age from date of birth
 * @param birthDate - Date of birth
 * @returns Age in years
 */
export function calculateAge(birthDate: Date): number {
	const today = new Date();
	const birth = new Date(birthDate);
	let age = today.getFullYear() - birth.getFullYear();
	const monthDiff = today.getMonth() - birth.getMonth();

	if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
		age--;
	}

	return age;
}

/**
 * Formats a date of birth with age in parentheses
 * @param dateOfBirth - Date of birth
 * @param age - Age in years (optional, will be calculated if not provided)
 * @returns Formatted string like "25/10/2015 (10 anos)"
 */
export function formatDateOfBirthWithAge(dateOfBirth: Date | null, age?: number | null): string {
	if (!dateOfBirth) {
		return 'Data não informada';
	}

	const date = new Date(dateOfBirth);
	const formattedDate = date.toLocaleDateString('pt-BR');

	// Calculate age if not provided
	if (age === null || age === undefined) {
		age = calculateAge(date);
	}

	const ageLabel = age === 1 ? 'ano' : 'anos';
	return `${formattedDate} (${age} ${ageLabel})`;
}
