<script lang="ts">
	import type { PageData } from './$types';
	import EvaluationHeader from '$lib/components/app/EvaluationHeader.svelte';
	import EvaluationFooter from '$lib/components/app/EvaluationFooter.svelte';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import { formatPeriod, calculateAge } from '$lib/utils/periods';

	let { data }: { data: PageData } = $props();

	// State management
	let alunoAusente = $state(false);
	let activeTab = $state('antropometria');

	// Calculate age using shared utility function
	const age = $derived(calculateAge(data.student.data_nasc!));

	// Save handler (placeholder for Story 2.7)
	function handleSave() {
		console.log('Save functionality will be implemented in Story 2.7');
	}
</script>

<div class="flex flex-col h-screen bg-gray-50">
	<!-- Breadcrumb Navigation -->
	<div class="bg-white border-b border-gray-200 p-3">
		<Breadcrumb.Root>
			<Breadcrumb.List>
				<Breadcrumb.Item>
					<Breadcrumb.Link href="/dashboard">Dashboard</Breadcrumb.Link>
				</Breadcrumb.Item>
				<Breadcrumb.Separator />
				<Breadcrumb.Item>
					<Breadcrumb.Link href={`/escolas/${data.enrollment.escola_id}`}>
						{data.enrollment.escola_nome}
					</Breadcrumb.Link>
				</Breadcrumb.Item>
				<Breadcrumb.Separator />
				<Breadcrumb.Item>
					<Breadcrumb.Link
						href={`/escolas/${data.enrollment.escola_id}/${encodeURIComponent(data.enrollment.periodo)}`}
					>
						{formatPeriod(data.enrollment.periodo)}
					</Breadcrumb.Link>
				</Breadcrumb.Item>
				<Breadcrumb.Separator />
				<Breadcrumb.Item>
					<Breadcrumb.Page>{data.enrollment.turma}</Breadcrumb.Page>
				</Breadcrumb.Item>
			</Breadcrumb.List>
		</Breadcrumb.Root>
	</div>

	<!-- Fixed Header -->
	<EvaluationHeader
		studentName={data.student.cliente}
		dateOfBirth={data.student.data_nasc!}
		{age}
		bind:alunoAusente
	/>

	<!-- Scrollable Content Area with Tabs -->
	<div class="flex-1 overflow-y-auto">
		<div class="p-4">
			<Tabs.Root bind:value={activeTab}>
				<Tabs.List>
					<Tabs.Trigger value="antropometria">Antropometria</Tabs.Trigger>
					<Tabs.Trigger value="visual">Visual</Tabs.Trigger>
					<Tabs.Trigger value="odonto">Odonto</Tabs.Trigger>
				</Tabs.List>

				<Tabs.Content value="antropometria">
					<div
						class="bg-white rounded-lg border border-gray-200 p-6 min-h-[300px] flex items-center justify-center"
					>
						<p class="text-gray-500 text-center">
							Formulário de Avaliação Antropométrica<br />
							<span class="text-sm">(Será implementado na Story 2.4)</span>
						</p>
					</div>
				</Tabs.Content>

				<Tabs.Content value="visual">
					<div
						class="bg-white rounded-lg border border-gray-200 p-6 min-h-[300px] flex items-center justify-center"
					>
						<p class="text-gray-500 text-center">
							Formulário de Avaliação de Acuidade Visual<br />
							<span class="text-sm">(Será implementado na Story 2.5)</span>
						</p>
					</div>
				</Tabs.Content>

				<Tabs.Content value="odonto">
					<div
						class="bg-white rounded-lg border border-gray-200 p-6 min-h-[300px] flex items-center justify-center"
					>
						<p class="text-gray-500 text-center">
							Formulário de Avaliação Odontológica<br />
							<span class="text-sm">(Será implementado na Story 2.6)</span>
						</p>
					</div>
				</Tabs.Content>
			</Tabs.Root>
		</div>
	</div>

	<!-- Fixed Footer -->
	<EvaluationFooter
		previousStudentId={data.navigation.previousStudentId}
		nextStudentId={data.navigation.nextStudentId}
		currentPosition={data.navigation.currentPosition}
		totalStudents={data.navigation.totalStudents}
		onsave={handleSave}
	/>
</div>
