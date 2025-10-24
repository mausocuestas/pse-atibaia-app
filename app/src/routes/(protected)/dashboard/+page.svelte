<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const user = data.session?.user as any;
</script>

<div class="flex flex-1 flex-col gap-4 p-4">
	<div class="bg-white rounded-lg shadow p-6">
		<h2 class="text-xl font-semibold text-gray-900 mb-4">Bem-vindo!</h2>

		<div class="space-y-2">
			<p class="text-gray-700">
				<span class="font-medium">Nome:</span>
				{user?.nome_profissional || user?.name || 'N/A'}
			</p>
			<p class="text-gray-700">
				<span class="font-medium">Email:</span>
				{user?.email || 'N/A'}
			</p>
			<p class="text-gray-700">
				<span class="font-medium">ID Profissional:</span>
				{user?.profissional_id || 'N/A'}
			</p>
			<p class="text-gray-700">
				<span class="font-medium">ID Avaliador:</span>
				{user?.avaliador_id || 'N/A'}
			</p>
			<p class="text-gray-700">
				<span class="font-medium">ID USF:</span>
				{user?.usf_id || 'N/A'}
			</p>
		</div>

		<div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
			<p class="text-sm text-blue-800">
				Este é um dashboard temporário. Funcionalidades adicionais serão implementadas em
				histórias futuras.
			</p>
		</div>
	</div>
</div>
