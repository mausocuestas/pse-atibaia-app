import { localEvaluationStore } from '$lib/stores/local-evaluation-store.svelte';

export type EvaluationSyncStatus = 'Pendente' | 'Salvo Localmente' | 'Sincronizado' | 'Erro';

/**
 * Determine the sync status for a student evaluation
 * @param alunoId - Student ID
 * @param hasServerData - Whether server has evaluation data for this student (any evaluation)
 * @returns Evaluation sync status string
 */
export async function getEvaluationSyncStatus(
	alunoId: number,
	hasServerData: boolean
): Promise<EvaluationSyncStatus> {
	try {
		const localData = await localEvaluationStore.loadEvaluation(alunoId);

		// No local data and no server data = Pendente
		if (!localData && !hasServerData) {
			return 'Pendente';
		}

		// No local data but has server data = Sincronizado
		if (!localData && hasServerData) {
			return 'Sincronizado';
		}

		// Has local data - check sync status
		if (localData) {
			switch (localData.syncStatus) {
				case 'synced':
					return 'Sincronizado';
				case 'failed':
					return 'Erro';
				case 'pending':
					return 'Salvo Localmente';
				default:
					return 'Pendente';
			}
		}

		return 'Pendente';
	} catch (error) {
		console.error('Failed to determine sync status:', error);
		// Fallback to server data status if local storage check fails
		return hasServerData ? 'Sincronizado' : 'Pendente';
	}
}

/**
 * Get badge variant class for sync status
 * @param status - Evaluation sync status
 * @returns Tailwind CSS classes for badge styling
 */
export function getSyncStatusBadgeClass(status: EvaluationSyncStatus): string {
	switch (status) {
		case 'Pendente':
			return 'bg-gray-400 text-white';
		case 'Salvo Localmente':
			return 'bg-yellow-500 text-white';
		case 'Sincronizado':
			return 'bg-green-600 text-white';
		case 'Erro':
			return 'bg-red-600 text-white';
		default:
			return 'bg-gray-400 text-white';
	}
}

/**
 * Check if a student has any evaluation data (local or server)
 * @param alunoId - Student ID
 * @param hasServerData - Whether server has evaluation data
 * @returns true if any data exists
 */
export async function hasAnyEvaluationData(
	alunoId: number,
	hasServerData: boolean
): Promise<boolean> {
	if (hasServerData) return true;

	const hasLocal = await localEvaluationStore.hasLocalData(alunoId);
	return hasLocal;
}
