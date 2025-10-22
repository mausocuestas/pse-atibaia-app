<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="min-h-screen bg-slate-50">
	<!-- Main Content -->
	<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<div class="bg-white rounded-lg shadow p-6">
			<h2 class="text-xl font-semibold text-gray-900 mb-4">Bem-vindo!</h2>

			<div class="space-y-2">
				<p class="text-gray-700">
					<span class="font-medium">Nome:</span>
					{data.user.nome_profissional || data.user.name}
				</p>
				<p class="text-gray-700">
					<span class="font-medium">Email:</span>
					{data.user.email}
				</p>
				<p class="text-gray-700">
					<span class="font-medium">ID Profissional:</span>
					{data.user.profissional_id}
				</p>
				<p class="text-gray-700">
					<span class="font-medium">ID Avaliador:</span>
					{data.user.avaliador_id}
				</p>
				<p class="text-gray-700">
					<span class="font-medium">ID USF:</span>
					{data.user.usf_id}
				</p>
			</div>

			<div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
				<p class="text-sm text-blue-800">
					Este é um dashboard temporário. Funcionalidades adicionais serão implementadas em
					histórias futuras.
				</p>
			</div>
		</div>
	</main>
</div>
