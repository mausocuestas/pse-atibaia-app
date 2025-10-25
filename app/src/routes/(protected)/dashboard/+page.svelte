<script lang="ts">
	import type { PageData } from './$types';
	import SchoolCard from '$lib/components/app/dashboard/SchoolCard.svelte';
	import { Button } from '$lib/components/ui/button/index.js';

	let { data }: { data: PageData } = $props();

	const user = data.session?.user as any;
	const schools = data.schools || [];
</script>

<div class="flex flex-1 flex-col gap-6 p-4 md:p-6">
	<!-- Header Section -->
	<div>
		<h1 class="text-2xl font-bold text-gray-900 mb-1">
			Olá, {user?.apelido || user?.name || 'Avaliador'}!
		</h1>
		<p class="text-gray-600">Bem-vindo ao seu painel de avaliações.</p>
	</div>

	<!-- Schools Section -->
	<div class="space-y-4">
		<h2 class="text-xl font-semibold text-gray-900">Minhas Escolas</h2>

		{#if schools.length === 0}
			<div class="text-center py-12 bg-white rounded-lg shadow">
				<p class="text-gray-500">Nenhuma escola associada à sua USF.</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
				{#each schools as school (school.inep)}
					<SchoolCard {school} />
				{/each}
			</div>
		{/if}
	</div>

	<!-- Access All Schools Button -->
	<div class="flex justify-center">
		<Button variant="outline" href="/escolas" class="w-full md:w-auto">
			Acessar todas as escolas
		</Button>
	</div>
</div>
