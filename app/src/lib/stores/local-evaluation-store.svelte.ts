import { openDB, type IDBPDatabase } from 'idb';
import { z } from 'zod';

const DB_NAME = 'pse-evaluations';
const STORE_NAME = 'evaluations';
const DB_VERSION = 1;

// Zod validation schemas
const AnthropometrySchema = z.object({
	peso_kg: z.number().nullable(),
	altura_cm: z.number().nullable(),
	classificacao_cdc: z.string().nullable()
});

const VisualAcuitySchema = z.object({
	olho_direito: z.number().nullable(),
	olho_esquerdo: z.number().nullable(),
	reteste: z.number().nullable()
});

const DentalSchema = z.object({
	risco: z.string().nullable(),
	complemento: z.string().nullable(),
	classificacao_completa: z.string().nullable(),
	recebeu_atf: z.boolean(),
	precisa_art: z.boolean(),
	qtde_dentes_art: z.number(),
	has_escovacao: z.boolean(),
	observacoes: z.string().nullable()
});

const LocalEvaluationDataSchema = z.object({
	alunoId: z.number(),
	timestamp: z.number(),
	syncStatus: z.enum(['pending', 'synced', 'failed']),
	lastSyncAttempt: z.number().nullable(),

	// Student context
	studentName: z.string(),
	escolaId: z.number(),
	turmaName: z.string(),
	periodo: z.string(),

	// Evaluation data
	alunoAusente: z.boolean(),
	anthropometry: AnthropometrySchema.nullable(),
	visualAcuity: VisualAcuitySchema.nullable(),
	dental: DentalSchema.nullable()
});

export type LocalEvaluationData = z.infer<typeof LocalEvaluationDataSchema>;
export type SyncStatus = 'pending' | 'synced' | 'failed';

/**
 * Svelte 5 runes-based reactive store for local evaluation storage
 * Uses IndexedDB for structured offline data storage
 */
class LocalEvaluationStore {
	private db = $state<IDBPDatabase | null>(null);
	public pendingCount = $state(0);
	private initialized = $state(false);

	/**
	 * Initialize the IndexedDB database
	 */
	async init(): Promise<void> {
		if (this.initialized) return;

		try {
			this.db = await openDB(DB_NAME, DB_VERSION, {
				upgrade(db) {
					if (!db.objectStoreNames.contains(STORE_NAME)) {
						const store = db.createObjectStore(STORE_NAME, { keyPath: 'alunoId' });
						store.createIndex('syncStatus', 'syncStatus');
						store.createIndex('timestamp', 'timestamp');
					}
				}
			});
			this.initialized = true;
			await this.updatePendingCount();
		} catch (error) {
			console.error('Failed to initialize IndexedDB:', error);
			// Graceful degradation - store remains usable but will return null/empty results
		}
	}

	/**
	 * Update the count of pending evaluations
	 */
	private async updatePendingCount(): Promise<void> {
		if (!this.db) return;

		try {
			const tx = this.db.transaction(STORE_NAME, 'readonly');
			const index = tx.store.index('syncStatus');
			const count = await index.count('pending');
			this.pendingCount = count;
		} catch (error) {
			console.error('Failed to update pending count:', error);
		}
	}

	/**
	 * Save evaluation data to local storage
	 * @param data - Evaluation data to save
	 * @returns true if save was successful, false otherwise
	 */
	async saveEvaluation(data: LocalEvaluationData): Promise<boolean> {
		if (!this.db) {
			await this.init();
			if (!this.db) return false;
		}

		try {
			// Validate data structure
			const validatedData = LocalEvaluationDataSchema.parse(data);

			// Update timestamp to current time
			validatedData.timestamp = Date.now();

			const tx = this.db.transaction(STORE_NAME, 'readwrite');
			await tx.store.put(validatedData);
			await tx.done;

			await this.updatePendingCount();
			return true;
		} catch (error) {
			if (error instanceof Error && error.name === 'QuotaExceededError') {
				console.error('Storage quota exceeded. Consider clearing old evaluations.');
			} else {
				console.error('Failed to save evaluation locally:', error);
			}
			return false;
		}
	}

	/**
	 * Load evaluation data from local storage
	 * @param alunoId - Student ID
	 * @returns Evaluation data or null if not found
	 */
	async loadEvaluation(alunoId: number): Promise<LocalEvaluationData | null> {
		if (!this.db) {
			await this.init();
			if (!this.db) return null;
		}

		try {
			const tx = this.db.transaction(STORE_NAME, 'readonly');
			const data = await tx.store.get(alunoId);

			if (!data) return null;

			// Validate data integrity on load
			const validatedData = LocalEvaluationDataSchema.parse(data);
			return validatedData;
		} catch (error) {
			console.error('Failed to load evaluation from local storage:', error);
			// If data is corrupted, return null
			return null;
		}
	}

	/**
	 * Mark an evaluation as synced to the server
	 * @param alunoId - Student ID
	 * @returns true if update was successful, false otherwise
	 */
	async markSynced(alunoId: number): Promise<boolean> {
		if (!this.db) {
			await this.init();
			if (!this.db) return false;
		}

		try {
			const tx = this.db.transaction(STORE_NAME, 'readwrite');
			const data = await tx.store.get(alunoId);

			if (data) {
				data.syncStatus = 'synced';
				data.lastSyncAttempt = Date.now();
				await tx.store.put(data);
			}

			await tx.done;
			await this.updatePendingCount();
			return true;
		} catch (error) {
			console.error('Failed to mark evaluation as synced:', error);
			return false;
		}
	}

	/**
	 * Get all pending (unsynced) evaluations
	 * @returns Array of pending evaluations
	 */
	async getPendingEvaluations(): Promise<LocalEvaluationData[]> {
		if (!this.db) {
			await this.init();
			if (!this.db) return [];
		}

		try {
			const tx = this.db.transaction(STORE_NAME, 'readonly');
			const index = tx.store.index('syncStatus');
			const evaluations = await index.getAll('pending');
			return evaluations;
		} catch (error) {
			console.error('Failed to get pending evaluations:', error);
			return [];
		}
	}

	/**
	 * Clear evaluation from local storage (after successful sync)
	 * @param alunoId - Student ID
	 * @returns true if deletion was successful, false otherwise
	 */
	async clearEvaluation(alunoId: number): Promise<boolean> {
		if (!this.db) {
			await this.init();
			if (!this.db) return false;
		}

		try {
			const tx = this.db.transaction(STORE_NAME, 'readwrite');
			await tx.store.delete(alunoId);
			await tx.done;

			await this.updatePendingCount();
			return true;
		} catch (error) {
			console.error('Failed to clear evaluation from local storage:', error);
			return false;
		}
	}

	/**
	 * Update sync status for a specific evaluation
	 * @param alunoId - Student ID
	 * @param status - New sync status
	 * @returns true if update was successful, false otherwise
	 */
	async updateSyncStatus(alunoId: number, status: SyncStatus): Promise<boolean> {
		if (!this.db) {
			await this.init();
			if (!this.db) return false;
		}

		try {
			const tx = this.db.transaction(STORE_NAME, 'readwrite');
			const data = await tx.store.get(alunoId);

			if (data) {
				data.syncStatus = status;
				data.lastSyncAttempt = Date.now();
				await tx.store.put(data);
			}

			await tx.done;
			await this.updatePendingCount();
			return true;
		} catch (error) {
			console.error('Failed to update sync status:', error);
			return false;
		}
	}

	/**
	 * Get all evaluations (for debugging/admin purposes)
	 * @returns Array of all evaluations
	 */
	async getAllEvaluations(): Promise<LocalEvaluationData[]> {
		if (!this.db) {
			await this.init();
			if (!this.db) return [];
		}

		try {
			const tx = this.db.transaction(STORE_NAME, 'readonly');
			const evaluations = await tx.store.getAll();
			return evaluations;
		} catch (error) {
			console.error('Failed to get all evaluations:', error);
			return [];
		}
	}

	/**
	 * Check if there is local data for a specific student
	 * @param alunoId - Student ID
	 * @returns true if local data exists, false otherwise
	 */
	async hasLocalData(alunoId: number): Promise<boolean> {
		const data = await this.loadEvaluation(alunoId);
		return data !== null;
	}

	/**
	 * Get sync status for a specific student
	 * @param alunoId - Student ID
	 * @returns Sync status or null if no local data
	 */
	async getSyncStatus(alunoId: number): Promise<SyncStatus | null> {
		const data = await this.loadEvaluation(alunoId);
		return data ? data.syncStatus : null;
	}
}

// Export singleton instance
export const localEvaluationStore = new LocalEvaluationStore();
