<script lang="ts">
	import type { PageData } from './$types';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';

	let { data }: { data: PageData } = $props();

	const escola = data.escola;
	const periodo = data.periodo;
	const classes = data.classes || [];
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
				<Breadcrumb.Page>{periodo || 'Período'}</Breadcrumb.Page>
			</Breadcrumb.Item>
		</Breadcrumb.List>
	</Breadcrumb.Root>

	<!-- Period Header -->
	<div>
		<h1 class="text-2xl font-bold text-gray-900 mb-1">
			{escola?.escola || 'Escola'} - {periodo || 'Período'}
		</h1>
		<p class="text-gray-600">Turmas do período {periodo}</p>
	</div>

	<!-- Classes Section -->
	<div class="space-y-4">
		<h2 class="text-xl font-semibold text-gray-900">Turmas</h2>

		{#if classes.length === 0}
			<div class="text-center py-12 bg-white rounded-lg shadow">
				<p class="text-gray-500">Nenhuma turma encontrada para este período.</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each classes as turma (turma.turma)}
					<a href="/escolas/{escola?.inep}/{encodeURIComponent(periodo || '')}/{encodeURIComponent(turma.turma)}">
						<Card.Root class="hover:shadow-lg transition-shadow cursor-pointer h-full">
							<Card.Header>
								<Card.Title class="text-lg">{turma.turma}</Card.Title>
								<Card.Description>
									{turma.total_alunos} {turma.total_alunos === 1 ? 'aluno' : 'alunos'}
								</Card.Description>
							</Card.Header>
						</Card.Root>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</div>
