<script lang="ts">
	import { Button } from '$lib/components/ui/button';
</script>

<div class="flex flex-col items-center justify-center min-h-screen bg-slate-100 gap-4">
	<h1 class="text-4xl font-bold text-blue-600 mb-4">Welcome to SvelteKit</h1>
	<p class="text-lg text-gray-700">
		Visit <a href="https://svelte.dev/docs/kit" class="text-blue-500 hover:underline">svelte.dev/docs/kit</a> to read the documentation
	</p>

	<div class="flex gap-2 mt-4">
		<Button>Default Button</Button>
		<Button variant="secondary">Secondary</Button>
		<Button variant="destructive">Destructive</Button>
		<Button variant="outline">Outline</Button>
	</div>
</div>
