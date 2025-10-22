<script lang="ts">
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';

	$: error = $page.url.searchParams.get('error');
</script>

<div class="flex flex-col items-center justify-center min-h-screen bg-slate-50">
	<div class="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
		<!-- Error Icon -->
		<div class="flex justify-center">
			<div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
				<svg
					class="w-8 h-8 text-red-600"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
					/>
				</svg>
			</div>
		</div>

		<!-- Error Message -->
		<div class="text-center space-y-2">
			<h1 class="text-2xl font-bold text-gray-900">Acesso Negado</h1>
			<p class="text-sm text-gray-600">
				Sua conta não está autorizada a acessar este sistema.
			</p>
		</div>

		<!-- Error Details -->
		{#if error === 'AccessDenied'}
			<div class="bg-red-50 border border-red-200 rounded-lg p-4">
				<p class="text-sm text-red-800">
					Apenas usuários cadastrados como avaliadores ativos podem acessar o sistema.
				</p>
			</div>
		{:else if error}
			<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
				<p class="text-sm text-yellow-800">
					Ocorreu um erro durante a autenticação: {error}
				</p>
			</div>
		{/if}

		<!-- Instructions -->
		<div class="text-center space-y-4">
			<p class="text-xs text-gray-500">
				Se você acredita que deveria ter acesso, entre em contato com o administrador do sistema.
			</p>

			<Button href="/" class="w-full" variant="outline">
				Voltar para Login
			</Button>
		</div>
	</div>
</div>
