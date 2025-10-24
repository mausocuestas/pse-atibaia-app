<script lang="ts">
	import AppSidebar from '$lib/components/app/sidebar/AppSidebar.svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: any } = $props();
</script>

<AppSidebar session={data.session}>
	{@render children?.()}
</AppSidebar>
