<script lang="ts">
	import type { Session } from '@auth/core/types';
	import type { Snippet } from 'svelte';
	import HomeIcon from '@lucide/svelte/icons/home';
	import ClipboardIcon from '@lucide/svelte/icons/clipboard';
	import SchoolIcon from '@lucide/svelte/icons/school';
	import UsersIcon from '@lucide/svelte/icons/users';
	import UserCheckIcon from '@lucide/svelte/icons/user-check';
	import EyeIcon from '@lucide/svelte/icons/eye';
	import RulerIcon from '@lucide/svelte/icons/ruler';
	import SmileIcon from '@lucide/svelte/icons/smile';
	import BarChartIcon from '@lucide/svelte/icons/bar-chart';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import BookOpenIcon from '@lucide/svelte/icons/book-open';
	import HelpCircleIcon from '@lucide/svelte/icons/help-circle';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import { signOut } from '@auth/sveltekit/client';
	import NavSecondary from './nav-secondary.svelte';
	import SiteHeader from './site-header.svelte';

	interface Props {
		session: Session;
		children?: Snippet;
	}

	let { session, children }: Props = $props();

	const user = session.user as any;
	const isGestor = user?.is_gestor || false;

	// State for collapsible menu
	let gestorMenuOpen = $state(true);

	const gestorItems = [
		{
			title: 'Dashboard',
			url: '/gestor/dashboard',
			icon: LayoutDashboardIcon
		},
		{
			title: 'Alunos',
			url: '/gestor/alunos',
			icon: UsersIcon
		},
		{
			title: 'Relatórios',
			url: '/gestor/relatorios',
			icon: FileTextIcon
		}
	];

	const navItems = [
		{
			title: 'Dashboard',
			url: '/dashboard',
			icon: HomeIcon
		},
		{
			title: 'Atendimentos',
			url: '#',
			icon: ClipboardIcon
		},
		{
			title: 'Escolas',
			url: '#',
			icon: SchoolIcon
		},
		{
			title: 'Avaliadores',
			url: '#',
			icon: UserCheckIcon
		},
		{
			title: 'Acuidade Visual',
			url: '#',
			icon: EyeIcon
		},
		{
			title: 'Antropometria',
			url: '#',
			icon: RulerIcon
		},
		{
			title: 'Odontologia',
			url: '#',
			icon: SmileIcon
		},
		{
			title: 'Relatórios',
			url: '#',
			icon: BarChartIcon
		}
	];

	const supportItems = [
		{
			title: 'Documentos',
			url: '#',
			icon: FileTextIcon
		},
		{
			title: 'Instruções',
			url: '#',
			icon: BookOpenIcon
		},
		{
			title: 'FAQ',
			url: '#',
			icon: HelpCircleIcon
		}
	];

	async function handleLogout() {
		await signOut({ callbackUrl: '/' });
	}
</script>

<Sidebar.Provider>
	<Sidebar.Root>
		<Sidebar.Header>
			<Sidebar.Menu>
				<Sidebar.MenuItem>
					<Sidebar.MenuButton size="lg">
						{#snippet child({ props })}
							<div {...props} class="flex items-center gap-2">
								<div
									class="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
								>
									<span class="text-lg font-bold">PSE</span>
								</div>
								<div class="grid flex-1 text-left text-sm leading-tight">
									<span class="truncate font-semibold">Programa Saúde na Escola</span>
									<span class="truncate text-xs">Atibaia</span>
								</div>
							</div>
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			</Sidebar.Menu>
		</Sidebar.Header>

		<Sidebar.Content>
			<!-- Gestor Section (only visible for managers) -->
			{#if isGestor}
				<Sidebar.Group>
					<Sidebar.GroupLabel>
						<button
							class="flex w-full items-center justify-between text-left"
							onclick={() => (gestorMenuOpen = !gestorMenuOpen)}
						>
							<span>Gestor</span>
							<ChevronRightIcon
								class="h-4 w-4 transition-transform duration-200 {gestorMenuOpen
									? 'rotate-90'
									: ''}"
							/>
						</button>
					</Sidebar.GroupLabel>
					{#if gestorMenuOpen}
						<Sidebar.GroupContent>
							<Sidebar.Menu>
								{#each gestorItems as item}
									<Sidebar.MenuItem>
										<Sidebar.MenuButton tooltipContent={item.title}>
											{#snippet child({ props })}
												<a href={item.url} {...props}>
													<item.icon />
													<span>{item.title}</span>
												</a>
											{/snippet}
										</Sidebar.MenuButton>
									</Sidebar.MenuItem>
								{/each}
							</Sidebar.Menu>
						</Sidebar.GroupContent>
					{/if}
				</Sidebar.Group>
			{/if}

			<Sidebar.Group>
				<Sidebar.GroupLabel>Navegação</Sidebar.GroupLabel>
				<Sidebar.Menu>
					{#each navItems as item}
						<Sidebar.MenuItem>
							<Sidebar.MenuButton tooltipContent={item.title}>
								{#snippet child({ props })}
									<a href={item.url} {...props}>
										<item.icon />
										<span>{item.title}</span>
									</a>
								{/snippet}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
					{/each}
				</Sidebar.Menu>
			</Sidebar.Group>

			<NavSecondary items={supportItems} class="mt-auto" />
		</Sidebar.Content>

		<Sidebar.Footer>
			<Sidebar.Menu>
				<Sidebar.MenuItem>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Sidebar.MenuButton
									size="lg"
									class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
									{...props}
								>
									<Avatar.Root class="size-8 rounded-lg">
										<Avatar.Image src={user?.image} alt={user?.name} />
										<Avatar.Fallback class="rounded-lg">
											{user?.name?.charAt(0).toUpperCase() || 'U'}
										</Avatar.Fallback>
									</Avatar.Root>
									<div class="grid flex-1 text-left text-sm leading-tight">
										<span class="truncate font-medium">
											{user?.name || 'Usuário'}
										</span>
										<span class="truncate text-xs">{user?.email || ''}</span>
									</div>
									<ChevronsUpDownIcon class="ml-auto size-4" />
								</Sidebar.MenuButton>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content
							class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
							side="right"
							align="end"
							sideOffset={4}
						>
							<DropdownMenu.Label class="p-0 font-normal">
								<div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
									<Avatar.Root class="size-8 rounded-lg">
										<Avatar.Image src={user?.image} alt={user?.name} />
										<Avatar.Fallback class="rounded-lg">
											{user?.name?.charAt(0).toUpperCase() || 'U'}
										</Avatar.Fallback>
									</Avatar.Root>
									<div class="grid flex-1 text-left text-sm leading-tight">
										<span class="truncate font-medium">
											{user?.name || 'Usuário'}
										</span>
										<span class="truncate text-xs">{user?.email || ''}</span>
									</div>
								</div>
							</DropdownMenu.Label>
							<DropdownMenu.Separator />
							<DropdownMenu.Item onclick={handleLogout}>
								<LogOutIcon />
								Sair
							</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</Sidebar.MenuItem>
			</Sidebar.Menu>
		</Sidebar.Footer>
	</Sidebar.Root>

	<Sidebar.Inset>
		<SiteHeader />
		{@render children?.()}
	</Sidebar.Inset>
</Sidebar.Provider>
