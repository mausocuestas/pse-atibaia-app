import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { localEvaluationStore, type LocalEvaluationData } from './local-evaluation-store.svelte';

// Mock IndexedDB
beforeEach(() => {
	// Reset IndexedDB for each test
	globalThis.indexedDB = new IDBFactory();
});

afterEach(async () => {
	// Clear all data after each test
	try {
		const allEvals = await localEvaluationStore.getAllEvaluations();
		for (const evaluation of allEvals) {
			await localEvaluationStore.clearEvaluation(evaluation.alunoId);
		}
	} catch (error) {
		// Ignore errors during cleanup
	}
});

// Mock evaluation data for tests
const mockEvaluation: LocalEvaluationData = {
	alunoId: 123,
	timestamp: Date.now(),
	syncStatus: 'pending',
	lastSyncAttempt: null,
	studentName: 'João Silva',
	escolaId: 1,
	turmaName: '5º Ano A',
	periodo: '2025-1',
	alunoAusente: false,
	anthropometry: {
		peso_kg: 45.5,
		altura_cm: 150.0,
		classificacao_cdc: 'Eutrofia'
	},
	visualAcuity: {
		olho_direito: 1.0,
		olho_esquerdo: 0.8,
		reteste: null
	},
	dental: {
		risco: 'baixo',
		complemento: null,
		classificacao_completa: 'Baixo Risco',
		recebeu_atf: false,
		precisa_art: false,
		qtde_dentes_art: 0,
		has_escovacao: true,
		observacoes: null
	}
};

describe('LocalEvaluationStore', () => {
	describe('Initialization', () => {
		it('should initialize the store', async () => {
			await localEvaluationStore.init();
			expect(localEvaluationStore.pendingCount).toBe(0);
		});

		it('should not reinitialize if already initialized', async () => {
			await localEvaluationStore.init();
			await localEvaluationStore.init(); // Should not throw error
			expect(localEvaluationStore.pendingCount).toBe(0);
		});
	});

	describe('Save and Load Evaluations', () => {

		it('should save evaluation with valid data', async () => {
			await localEvaluationStore.init();

			const success = await localEvaluationStore.saveEvaluation(mockEvaluation);
			expect(success).toBe(true);
			expect(localEvaluationStore.pendingCount).toBe(1);
		});

		it('should load saved evaluation correctly', async () => {
			await localEvaluationStore.init();
			await localEvaluationStore.saveEvaluation(mockEvaluation);

			const loaded = await localEvaluationStore.loadEvaluation(123);
			expect(loaded).not.toBeNull();
			expect(loaded?.alunoId).toBe(123);
			expect(loaded?.studentName).toBe('João Silva');
			expect(loaded?.anthropometry?.peso_kg).toBe(45.5);
			expect(loaded?.visualAcuity?.olho_direito).toBe(1.0);
			expect(loaded?.dental?.risco).toBe('baixo');
		});

		it('should return null for non-existent alunoId', async () => {
			await localEvaluationStore.init();

			const loaded = await localEvaluationStore.loadEvaluation(999);
			expect(loaded).toBeNull();
		});

		it('should save evaluation with partial data (only anthropometry)', async () => {
			await localEvaluationStore.init();

			const partialEval: LocalEvaluationData = {
				...mockEvaluation,
				visualAcuity: null,
				dental: null
			};

			const success = await localEvaluationStore.saveEvaluation(partialEval);
			expect(success).toBe(true);

			const loaded = await localEvaluationStore.loadEvaluation(123);
			expect(loaded?.anthropometry).not.toBeNull();
			expect(loaded?.visualAcuity).toBeNull();
			expect(loaded?.dental).toBeNull();
		});

		it('should update timestamp when saving', async () => {
			await localEvaluationStore.init();

			const eval1 = { ...mockEvaluation, timestamp: 1000 };
			await localEvaluationStore.saveEvaluation(eval1);

			const loaded = await localEvaluationStore.loadEvaluation(123);
			expect(loaded?.timestamp).toBeGreaterThan(1000);
		});

		it('should overwrite existing evaluation when saving with same alunoId', async () => {
			await localEvaluationStore.init();

			await localEvaluationStore.saveEvaluation(mockEvaluation);

			const updated = {
				...mockEvaluation,
				anthropometry: {
					peso_kg: 50.0,
					altura_cm: 155.0,
					classificacao_cdc: 'Sobrepeso'
				}
			};

			await localEvaluationStore.saveEvaluation(updated);

			const loaded = await localEvaluationStore.loadEvaluation(123);
			expect(loaded?.anthropometry?.peso_kg).toBe(50.0);
			expect(localEvaluationStore.pendingCount).toBe(1); // Still only 1 evaluation
		});
	});

	describe('Sync Status Management', () => {
		it('should mark evaluation as synced', async () => {
			await localEvaluationStore.init();
			await localEvaluationStore.saveEvaluation({
				...mockEvaluation,
				syncStatus: 'pending'
			});

			const success = await localEvaluationStore.markSynced(123);
			expect(success).toBe(true);

			const loaded = await localEvaluationStore.loadEvaluation(123);
			expect(loaded?.syncStatus).toBe('synced');
			expect(loaded?.lastSyncAttempt).not.toBeNull();
			expect(localEvaluationStore.pendingCount).toBe(0);
		});

		it('should update sync status to failed', async () => {
			await localEvaluationStore.init();
			await localEvaluationStore.saveEvaluation({
				...mockEvaluation,
				syncStatus: 'pending'
			});

			const success = await localEvaluationStore.updateSyncStatus(123, 'failed');
			expect(success).toBe(true);

			const loaded = await localEvaluationStore.loadEvaluation(123);
			expect(loaded?.syncStatus).toBe('failed');
			expect(loaded?.lastSyncAttempt).not.toBeNull();
		});

		it('should get sync status for evaluation', async () => {
			await localEvaluationStore.init();
			await localEvaluationStore.saveEvaluation({
				...mockEvaluation,
				syncStatus: 'pending'
			});

			const status = await localEvaluationStore.getSyncStatus(123);
			expect(status).toBe('pending');
		});

		it('should return null sync status for non-existent evaluation', async () => {
			await localEvaluationStore.init();

			const status = await localEvaluationStore.getSyncStatus(999);
			expect(status).toBeNull();
		});
	});

	describe('Pending Evaluations', () => {
		it('should get all pending evaluations', async () => {
			await localEvaluationStore.init();

			await localEvaluationStore.saveEvaluation({
				...mockEvaluation,
				alunoId: 1,
				syncStatus: 'pending'
			});
			await localEvaluationStore.saveEvaluation({
				...mockEvaluation,
				alunoId: 2,
				syncStatus: 'pending'
			});
			await localEvaluationStore.saveEvaluation({
				...mockEvaluation,
				alunoId: 3,
				syncStatus: 'synced'
			});

			const pending = await localEvaluationStore.getPendingEvaluations();
			expect(pending.length).toBe(2);
			expect(pending.every((evaluation) => evaluation.syncStatus === 'pending')).toBe(true);
		});

		it('should return empty array when no pending evaluations', async () => {
			await localEvaluationStore.init();

			const pending = await localEvaluationStore.getPendingEvaluations();
			expect(pending).toEqual([]);
		});

		it('should update pending count when marking as synced', async () => {
			await localEvaluationStore.init();

			await localEvaluationStore.saveEvaluation({
				...mockEvaluation,
				alunoId: 1,
				syncStatus: 'pending'
			});
			await localEvaluationStore.saveEvaluation({
				...mockEvaluation,
				alunoId: 2,
				syncStatus: 'pending'
			});

			expect(localEvaluationStore.pendingCount).toBe(2);

			await localEvaluationStore.markSynced(1);
			expect(localEvaluationStore.pendingCount).toBe(1);
		});
	});

	describe('Clear Evaluations', () => {
		it('should clear evaluation after successful sync', async () => {
			await localEvaluationStore.init();
			await localEvaluationStore.saveEvaluation(mockEvaluation);

			const success = await localEvaluationStore.clearEvaluation(123);
			expect(success).toBe(true);

			const loaded = await localEvaluationStore.loadEvaluation(123);
			expect(loaded).toBeNull();
			expect(localEvaluationStore.pendingCount).toBe(0);
		});

		it('should handle clearing non-existent evaluation', async () => {
			await localEvaluationStore.init();

			const success = await localEvaluationStore.clearEvaluation(999);
			expect(success).toBe(true); // Should not throw error
		});
	});

	describe('Local Data Checks', () => {
		it('should check if local data exists for student', async () => {
			await localEvaluationStore.init();
			await localEvaluationStore.saveEvaluation(mockEvaluation);

			const hasData = await localEvaluationStore.hasLocalData(123);
			expect(hasData).toBe(true);

			const noData = await localEvaluationStore.hasLocalData(999);
			expect(noData).toBe(false);
		});
	});

	describe('Get All Evaluations', () => {
		it('should get all evaluations regardless of sync status', async () => {
			await localEvaluationStore.init();

			await localEvaluationStore.saveEvaluation({
				...mockEvaluation,
				alunoId: 1,
				syncStatus: 'pending'
			});
			await localEvaluationStore.saveEvaluation({
				...mockEvaluation,
				alunoId: 2,
				syncStatus: 'synced'
			});
			await localEvaluationStore.saveEvaluation({
				...mockEvaluation,
				alunoId: 3,
				syncStatus: 'failed'
			});

			const all = await localEvaluationStore.getAllEvaluations();
			expect(all.length).toBe(3);
		});
	});

	describe('Error Handling', () => {
		it('should handle Zod validation errors gracefully', async () => {
			await localEvaluationStore.init();

			// Testing invalid data - intentionally passing incorrect type
			const invalidData = { alunoId: 'invalid' } as any;

			const success = await localEvaluationStore.saveEvaluation(invalidData);
			expect(success).toBe(false);
		});

		it('should handle corrupted data gracefully on load', async () => {
			await localEvaluationStore.init();

			// Manually insert corrupted data (bypassing validation) using idb
			const { openDB } = await import('idb');
			const db = await openDB('pse-evaluations', 1, {
				upgrade(upgradeDb) {
					if (!upgradeDb.objectStoreNames.contains('evaluations')) {
						const store = upgradeDb.createObjectStore('evaluations', { keyPath: 'alunoId' });
						store.createIndex('syncStatus', 'syncStatus');
						store.createIndex('timestamp', 'timestamp');
					}
				}
			});
			const tx = db.transaction('evaluations', 'readwrite');
			await tx.store.put({ alunoId: 456, invalidField: 'corrupt' });
			await tx.done;

			const loaded = await localEvaluationStore.loadEvaluation(456);
			expect(loaded).toBeNull(); // Should return null for corrupted data
		});
	});

	describe('Data Integrity', () => {
		it('should validate all required fields are present', async () => {
			await localEvaluationStore.init();

			const evalWithAllFields: LocalEvaluationData = {
				alunoId: 789,
				timestamp: Date.now(),
				syncStatus: 'pending',
				lastSyncAttempt: null,
				studentName: 'Maria Santos',
				escolaId: 2,
				turmaName: '6º Ano B',
				periodo: '2025-1',
				alunoAusente: true,
				anthropometry: null,
				visualAcuity: null,
				dental: null
			};

			const success = await localEvaluationStore.saveEvaluation(evalWithAllFields);
			expect(success).toBe(true);

			const loaded = await localEvaluationStore.loadEvaluation(789);
			expect(loaded?.alunoAusente).toBe(true);
			expect(loaded?.studentName).toBe('Maria Santos');
		});
	});
});
