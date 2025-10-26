import { localEvaluationStore, type LocalEvaluationData } from '$lib/stores/local-evaluation-store.svelte';

/**
 * Background sync results
 */
export interface BackgroundSyncResult {
	totalPending: number;
	synced: number;
	failed: number;
	errors: Array<{ alunoId: number; studentName: string; error: string }>;
}

/**
 * Attempt to sync a single evaluation to the server
 * @param evaluation - Local evaluation data
 * @returns true if sync was successful, false otherwise
 */
async function syncEvaluationToServer(evaluation: LocalEvaluationData): Promise<boolean> {
	try {
		const formData = new FormData();

		// Add anthropometry data if present
		if (evaluation.anthropometry) {
			if (evaluation.anthropometry.peso_kg)
				formData.append('peso_kg', String(evaluation.anthropometry.peso_kg));
			if (evaluation.anthropometry.altura_cm)
				formData.append('altura_cm', String(evaluation.anthropometry.altura_cm));
			if (evaluation.anthropometry.classificacao_cdc)
				formData.append('observacoes_antropometria', evaluation.anthropometry.classificacao_cdc);
		}

		// Add visual acuity data if present
		if (evaluation.visualAcuity) {
			if (evaluation.visualAcuity.olho_direito !== null)
				formData.append('olho_direito', String(evaluation.visualAcuity.olho_direito));
			if (evaluation.visualAcuity.olho_esquerdo !== null)
				formData.append('olho_esquerdo', String(evaluation.visualAcuity.olho_esquerdo));
			if (evaluation.visualAcuity.reteste !== null)
				formData.append('olho_direito_reteste', String(evaluation.visualAcuity.reteste));
		}

		// Add dental evaluation data if present
		if (evaluation.dental) {
			if (evaluation.dental.risco) formData.append('risco', evaluation.dental.risco);
			if (evaluation.dental.complemento)
				formData.append('complemento', evaluation.dental.complemento);
			if (evaluation.dental.classificacao_completa)
				formData.append('classificacao_completa', evaluation.dental.classificacao_completa);
			formData.append('recebeu_atf', String(evaluation.dental.recebeu_atf));
			formData.append('precisa_art', String(evaluation.dental.precisa_art));
			formData.append('qtde_dentes_art', String(evaluation.dental.qtde_dentes_art));
			formData.append('has_escovacao', String(evaluation.dental.has_escovacao));
			if (evaluation.dental.observacoes)
				formData.append('observacoes_dental', evaluation.dental.observacoes);
		}

		// Attempt to save to server
		const response = await fetch(`/avaliar/${evaluation.alunoId}?/saveEvaluation`, {
			method: 'POST',
			body: formData
		});

		const result = await response.json();

		if (result.type === 'success') {
			// Mark as synced and optionally clear from local storage
			await localEvaluationStore.markSynced(evaluation.alunoId);
			return true;
		} else {
			// Update sync status to failed
			await localEvaluationStore.updateSyncStatus(evaluation.alunoId, 'failed');
			return false;
		}
	} catch (error) {
		console.error('Failed to sync evaluation:', error);
		await localEvaluationStore.updateSyncStatus(evaluation.alunoId, 'failed');
		return false;
	}
}

/**
 * Perform background sync of all pending evaluations
 * @returns Background sync result summary
 */
export async function performBackgroundSync(): Promise<BackgroundSyncResult> {
	const result: BackgroundSyncResult = {
		totalPending: 0,
		synced: 0,
		failed: 0,
		errors: []
	};

	try {
		// Initialize store if not already initialized
		await localEvaluationStore.init();

		// Get all pending evaluations
		const pendingEvaluations = await localEvaluationStore.getPendingEvaluations();
		result.totalPending = pendingEvaluations.length;

		if (pendingEvaluations.length === 0) {
			console.log('📊 No pending evaluations to sync');
			return result;
		}

		console.log(`📊 Found ${pendingEvaluations.length} pending evaluations to sync`);

		// Attempt to sync each evaluation
		for (const evaluation of pendingEvaluations) {
			const success = await syncEvaluationToServer(evaluation);

			if (success) {
				result.synced++;
				console.log(`✅ Synced evaluation for student: ${evaluation.studentName}`);
			} else {
				result.failed++;
				result.errors.push({
					alunoId: evaluation.alunoId,
					studentName: evaluation.studentName,
					error: 'Failed to sync to server'
				});
				console.log(`❌ Failed to sync evaluation for student: ${evaluation.studentName}`);
			}
		}

		console.log(
			`📊 Background sync complete: ${result.synced} synced, ${result.failed} failed`
		);
	} catch (error) {
		console.error('Background sync error:', error);
	}

	return result;
}

/**
 * Check if background sync is needed
 * @returns true if there are pending evaluations, false otherwise
 */
export async function needsBackgroundSync(): Promise<boolean> {
	try {
		await localEvaluationStore.init();
		const pendingEvaluations = await localEvaluationStore.getPendingEvaluations();
		return pendingEvaluations.length > 0;
	} catch (error) {
		console.error('Failed to check if background sync is needed:', error);
		return false;
	}
}
