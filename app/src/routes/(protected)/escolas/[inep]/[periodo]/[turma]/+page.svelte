<script lang="ts">
	import type { PageData } from './$types';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { formatPeriod, formatDateOfBirthWithAge } from '$lib/utils/periods';
	import { localEvaluationStore } from '$lib/stores/local-evaluation-store.svelte';
	import { getEvaluationSyncStatus, getSyncStatusBadgeClass, type EvaluationSyncStatus } from '$lib/utils/sync-status';
	import { performBackgroundSync } from '$lib/utils/background-sync';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	let { data }: { data: PageData } = $props();

	const escola = data.escola;
	const periodo = data.periodo;
	const turma = data.turma;
	const students = data.students || [];

	// Sync status for each student
	let syncStatuses = $state<Record<number, EvaluationSyncStatus>>({});
	let isLoadingSyncStatus = $state(true);

	// Load sync status on mount and perform background sync
	onMount(async () => {
		await localEvaluationStore.init();

		// Perform background sync first
		const syncResult = await performBackgroundSync();

		// Show notification if any evaluations were synced
		if (syncResult.synced > 0) {
			toast.success(`${syncResult.synced} avaliação(ões) sincronizada(s)`, {
				description: 'Dados enviados ao servidor com sucesso',
				duration: 4000
			});
		}

		// Show warning if any failed
		if (syncResult.failed > 0) {
			toast.warning(`${syncResult.failed} avaliação(ões) não sincronizada(s)`, {
				description: 'Será tentado novamente na próxima vez',
				duration: 4000
			});
		}

		// Load all sync statuses after background sync
		await loadAllSyncStatuses();
		isLoadingSyncStatus = false;
	});

	// Load sync status for all students
	async function loadAllSyncStatuses() {
		const statuses: Record<number, EvaluationSyncStatus> = {};

		for (const student of students) {
			const hasServerData = student.has_visual_eval || student.has_anthropometric_eval || student.has_dental_eval;
			const status = await getEvaluationSyncStatus(student.aluno_id, hasServerData);
			statuses[student.aluno_id] = status;
		}

		syncStatuses = statuses;
	}
</script>

<div class="flex flex-1 flex-col gap-6 p-4 md:p-6">
	<!-- Breadcrumb Navigation -->
	<Breadcrumb.Root>
		<Breadcrumb.List>
			<Breadcrumb.Item>
				<Breadcrumb.Link href="/dashboard">Dashboard</Breadcrumb.Link>
			</Breadcrumb.Item>
			<Breadcrumb.Separator />
			<Breadcrumb.Item>
				<Breadcrumb.Link href="/escolas/{escola?.inep}">{escola?.escola || 'Escola'}</Breadcrumb.Link>
			</Breadcrumb.Item>
			<Breadcrumb.Separator />
			<Breadcrumb.Item>
				<Breadcrumb.Link href="/escolas/{escola?.inep}/{encodeURIComponent(periodo || '')}">{periodo ? formatPeriod(periodo) : 'Período'}</Breadcrumb.Link>
			</Breadcrumb.Item>
			<Breadcrumb.Separator />
			<Breadcrumb.Item>
				<Breadcrumb.Page>{turma || 'Turma'}</Breadcrumb.Page>
			</Breadcrumb.Item>
		</Breadcrumb.List>
	</Breadcrumb.Root>

	<!-- Class Header -->
	<div>
		<h1 class="text-2xl font-bold text-gray-900 mb-1">
			Turma {turma || ''}
		</h1>
		<p class="text-gray-600">
			{escola?.escola || 'Escola'} - {periodo ? formatPeriod(periodo) : 'Período'}
		</p>
	</div>

	<!-- Students Section -->
	<div class="space-y-4">
		<h2 class="text-xl font-semibold text-gray-900">
			Alunos ({students.length})
		</h2>

		{#if students.length === 0}
			<div class="text-center py-12 bg-white rounded-lg shadow">
				<p class="text-gray-500">Nenhum aluno matriculado nesta turma.</p>
			</div>
		{:else}
			<div class="flex flex-col gap-2">
				{#each students as student (student.aluno_id)}
					<a
						href="/avaliar/{student.aluno_id}"
						class="p-4 border rounded-lg hover:bg-gray-50 transition-colors bg-white block"
					>
						<div class="flex flex-col gap-2">
							<div class="font-medium text-gray-900">{student.nome}</div>
							<div class="text-sm text-gray-600">
								{formatDateOfBirthWithAge(student.data_nasc, student.idade)}
							</div>
							<div class="flex flex-wrap gap-2 mt-1">
								<!-- Sync Status Badge -->
								{#if !isLoadingSyncStatus && syncStatuses[student.aluno_id]}
									<Badge class={getSyncStatusBadgeClass(syncStatuses[student.aluno_id])}>
										{syncStatuses[student.aluno_id]}
									</Badge>
								{/if}

								<!-- Evaluation Type Badges -->
								{#if student.has_visual_eval}
									<Badge variant="secondary">Visual</Badge>
								{/if}
								{#if student.has_anthropometric_eval}
									<Badge variant="secondary">Antropométrica</Badge>
								{/if}
								{#if student.has_dental_eval}
									<Badge variant="secondary">Odontológica</Badge>
								{/if}
							</div>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</div>
