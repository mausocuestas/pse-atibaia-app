<script lang="ts">
	import PanelLeftIcon from '@lucide/svelte/icons/panel-left';
	import SearchForm from './search-form.svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';

	const sidebar = Sidebar.useSidebar();
</script>

<header class="bg-background sticky top-0 z-50 flex w-full items-center border-b">
	<div class="flex h-14 w-full items-center gap-2 px-4">
		<Button class="size-8" variant="ghost" size="icon" onclick={sidebar.toggle}>
			<PanelLeftIcon />
			<span class="sr-only">Toggle Sidebar</span>
		</Button>
		<Separator orientation="vertical" class="mr-2 h-4" />
		<Breadcrumb.Root class="hidden sm:block">
			<Breadcrumb.List>
				<Breadcrumb.Item>
					<Breadcrumb.Link href="/dashboard">PSE Atibaia</Breadcrumb.Link>
				</Breadcrumb.Item>
				<Breadcrumb.Separator />
				<Breadcrumb.Item>
					<Breadcrumb.Page>Dashboard</Breadcrumb.Page>
				</Breadcrumb.Item>
			</Breadcrumb.List>
		</Breadcrumb.Root>
		<SearchForm class="ml-auto w-full sm:w-auto" />
	</div>
</header>
