<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import LogoutButton from '$lib/components/auth/LogoutButton.svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: any } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<!-- Conditional Header for Authenticated Users -->
{#if data.session?.user}
	<header class="bg-white shadow-sm border-b">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
			<div class="flex justify-between items-center">
				<div>
					<h1 class="text-2xl font-bold text-gray-900">PSE BMAD</h1>
					<p class="text-sm text-gray-600">
						{(data.session.user as any).nome_profissional || data.session.user.name}
					</p>
				</div>
				<LogoutButton />
			</div>
		</div>
	</header>
{/if}

<!-- Main Content Area -->
{@render children?.()}
