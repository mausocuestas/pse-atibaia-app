<script lang="ts">
	import type { PageData } from './$types';
	import type { StudentData } from '$lib/server/db/queries/classes';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { formatPeriod, formatDateOfBirthWithAge } from '$lib/utils/periods';
	import { localEvaluationStore } from '$lib/stores/local-evaluation-store.svelte';
	import { getEvaluationSyncStatus, getSyncStatusBadgeClass, type EvaluationSyncStatus } from '$lib/utils/sync-status';
	import { performBackgroundSync } from '$lib/utils/background-sync';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { PlusIcon } from 'lucide-svelte';
	import StudentSearchModal from '$lib/components/student-search-modal.svelte';

	let { data }: { data: PageData } = $props();

	const escola = data.escola;
	const periodo = data.periodo;
	const turma = data.turma;
	let students = $state<StudentData[]>(data.students || []);
	const canAddStudents = data.canAddStudents || false;

	// Modal state
	let showSearchModal = $state(false);

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

	// Handle student enrollment
	async function handleStudentEnrolled(event: CustomEvent) {
		const { student } = event.detail;

		// Add the new student to the local students array
		const newStudent: StudentData = {
			aluno_id: student.id,
			nome: student.nomeCompleto,
			data_nasc: new Date(student.dataNascimento),
			idade: null, // Will be calculated if needed
			has_visual_eval: false,
			has_anthropometric_eval: false,
			has_dental_eval: false
		};

		students = [...students, newStudent];

		// Load sync status for the new student
		const status = await getEvaluationSyncStatus(student.id, false);
		syncStatuses[student.id] = status;

		toast.success(`${student.nomeCompleto} foi adicionado à turma com sucesso!`);
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
		<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
			<h2 class="text-xl font-semibold text-gray-900">
				Alunos ({students.length})
			</h2>

			{#if canAddStudents}
				<Button
					variant="outline"
					size="sm"
					class="w-full sm:w-auto"
					onclick={() => showSearchModal = true}
				>
					<PlusIcon class="h-4 w-4 mr-2" />
					Adicionar Aluno
				</Button>
			{/if}
		</div>

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

	<!-- Student Search Modal -->
	<StudentSearchModal
		bind:open={showSearchModal}
		escolaId={escola?.inep || 0}
		turma={turma || ''}
		periodo={periodo || ''}
		anoLetivo={data.anoLetivo || 2025}
		on:student-enrolled={handleStudentEnrolled}
		on:close={() => showSearchModal = false}
	/>
</div>
