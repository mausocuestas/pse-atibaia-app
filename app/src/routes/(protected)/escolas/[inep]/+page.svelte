<script lang="ts">
	import type { PageData } from './$types';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { Progress } from '$lib/components/ui/progress/index.js';
	import { formatPeriod } from '$lib/utils/periods';

	let { data }: { data: PageData } = $props();

	const escola = data.escola;
	const periods = data.periods || [];
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
				<Breadcrumb.Page>{escola?.escola || 'Escola'}</Breadcrumb.Page>
			</Breadcrumb.Item>
		</Breadcrumb.List>
	</Breadcrumb.Root>

	<!-- School Header -->
	<div>
		<h1 class="text-2xl font-bold text-gray-900 mb-1">
			{escola?.escola || 'Escola não encontrada'}
		</h1>
		{#if escola?.bairro || escola?.tipo}
			<p class="text-gray-600">
				{#if escola.tipo}{escola.tipo}{/if}
				{#if escola.bairro && escola.tipo} • {/if}
				{#if escola.bairro}{escola.bairro}{/if}
			</p>
		{/if}
	</div>

	<!-- Periods Section -->
	<div class="space-y-4">
		<h2 class="text-xl font-semibold text-gray-900">Períodos</h2>

		{#if periods.length === 0}
			<div class="text-center py-12 bg-white rounded-lg shadow">
				<p class="text-gray-500">Nenhum período disponível para esta escola.</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each periods as period (period.periodo)}
					{@const percentage = period.total_alunos > 0
						? Math.round((period.alunos_avaliados / period.total_alunos) * 100)
						: 0}
					<a href="/escolas/{escola?.inep}/{encodeURIComponent(period.periodo)}">
						<Card.Root class="hover:shadow-lg transition-shadow cursor-pointer h-full">
							<Card.Header class="pb-3">
								<div class="flex items-center justify-between">
									<Card.Title class="text-lg">{formatPeriod(period.periodo)}</Card.Title>
									<span class="text-sm text-gray-600">
										{period.total_alunos} aluno{period.total_alunos !== 1 ? 's' : ''}
									</span>
								</div>
							</Card.Header>
							<Card.Content class="space-y-1 pt-0">
								<div class="flex items-center justify-between text-xs">
									<span class="text-gray-600">{period.alunos_avaliados} alunos avaliados</span>
									<span class="font-medium text-gray-700">{percentage}%</span>
								</div>
								<Progress value={percentage} class="h-2" />
							</Card.Content>
						</Card.Root>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</div>
