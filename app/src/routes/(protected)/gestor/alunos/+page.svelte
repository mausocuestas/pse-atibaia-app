<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import * as Table from '$lib/components/ui/table';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import { Badge } from '$lib/components/ui/badge';
	import { Search, ChevronLeft, ChevronRight, User, Eye, Calendar } from '@lucide/svelte';

	let { data } = $props();

	// Reactive state
	let searchTerm = $state(data.filters.search);
	let selectedSchool = $state(data.filters.escola);
	let selectedYear = $state(data.filters.ano);
	let currentPage = $state(data.pagination.currentPage);

	// Build URL with current filter values
	function buildUrl(page: number = currentPage) {
		return `/gestor/alunos?search=${encodeURIComponent(searchTerm)}&escola=${selectedSchool}&ano=${selectedYear}&page=${page}&limit=${data.pagination.limit}`;
	}

	// Update URL when filters change
	function updateFilters() {
		currentPage = 1; // Reset to first page when filters change
		goto(buildUrl(1), { replaceState: true });
	}

	// Pagination functions
	function goToPage(page: number) {
		currentPage = page;
		goto(buildUrl(page), { replaceState: true });
	}

	function goToNextPage() {
		if (data.pagination.hasNextPage) {
			goToPage(currentPage + 1);
		}
	}

	function goToPrevPage() {
		if (data.pagination.hasPrevPage) {
			goToPage(currentPage - 1);
		}
	}

	// Format date
	function formatDate(dateString: string | Date) {
		const date = new Date(dateString);
		return date.toLocaleDateString('pt-BR');
	}

	// Calculate age
	function calculateAge(birthDate: string | Date) {
		const today = new Date();
		const birth = new Date(birthDate);
		let age = today.getFullYear() - birth.getFullYear();
		const monthDiff = today.getMonth() - birth.getMonth();

		if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
			age--;
		}

		return age;
	}

	// Get status badge for evaluations
	function getEvaluationStatus(student: any) {
		// Convert counts to boolean (has evaluation or not) then count types
		const hasAnthropometric = student.antropometric_count > 0 ? 1 : 0;
		const hasVisual = student.visual_count > 0 ? 1 : 0;
		const hasDental = student.dental_count > 0 ? 1 : 0;
		const total = hasAnthropometric + hasVisual + hasDental;

		if (total === 0) {
			return { variant: 'destructive' as const, text: 'Sem avaliações' };
		} else if (total === 3) {
			return { variant: 'default' as const, text: 'Completo' };
		} else {
			return { variant: 'secondary' as const, text: `${total}/3` };
		}
	}

	// Navigate to student details
	function viewStudent(studentId: number) {
		goto(`/gestor/alunos/${studentId}`);
	}

	// Handle form submission for search
	function handleSearch(event: Event) {
		event.preventDefault();
		updateFilters();
	}

	// Handle school selection change
	function handleSchoolChange(value: string | undefined) {
		selectedSchool = value || '';
		updateFilters();
	}

	// Handle year selection change
	function handleYearChange(value: string | undefined) {
		selectedYear = value || '';
		updateFilters();
	}
</script>

<div class="container mx-auto p-6 space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Alunos</h1>
			<p class="text-muted-foreground">
				Gerencie e visualize informações dos alunos
			</p>
		</div>
		<div class="flex items-center gap-2">
			{#if data.students.some(s => s.has_history > 0)}
				<Badge variant="secondary" class="flex items-center gap-1">
					<Calendar class="h-3 w-3" />
					Histórico disponível
				</Badge>
			{/if}
			<Badge variant="outline">
				{data.pagination.totalStudents} alunos
			</Badge>
		</div>
	</div>

	<!-- Filters Card -->
	<Card.Root>
		<Card.Header>
			<Card.Title>Filtros</Card.Title>
		</Card.Header>
		<Card.Content>
			<form class="grid grid-cols-1 md:grid-cols-4 gap-4" onsubmit={handleSearch}>
				<div class="space-y-2">
					<label for="search" class="text-sm font-medium">Buscar</label>
					<div class="relative">
						<Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
						<Input
							id="search"
							bind:value={searchTerm}
							placeholder="Nome, CPF, NIS ou data de nascimento"
							class="pl-8"
						/>
					</div>
				</div>

				<div class="space-y-2">
					<label for="escola" class="text-sm font-medium">Escola</label>
					<Select.Root
						type="single"
						value={selectedSchool}
						onValueChange={handleSchoolChange}
					>
						<Select.Trigger id="escola">
							{selectedSchool
								? data.schools.find(s => s.escola_id === selectedSchool)?.escola || 'Todas as escolas'
								: 'Todas as escolas'}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="" label="Todas as escolas">
								Todas as escolas
							</Select.Item>
							{#each data.schools as school}
								<Select.Item value={school.escola_id} label={school.escola}>
									{school.escola}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>

				<div class="space-y-2">
					<label for="ano" class="text-sm font-medium">Ano Letivo</label>
					<Select.Root
						type="single"
						value={selectedYear}
						onValueChange={handleYearChange}
					>
						<Select.Trigger id="ano">
							{selectedYear || 'Selecione o ano'}
						</Select.Trigger>
						<Select.Content>
							{#each data.years as year}
								<Select.Item value={year.ano_letivo} label={year.ano_letivo}>
									{year.ano_letivo}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>

				<div class="flex items-end">
					<Button type="submit" class="w-full">
						<Search class="mr-2 h-4 w-4" />
						Buscar
					</Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>

	<!-- Students Table -->
	<Card.Root>
		<Card.Content>
			{#if data.students.length > 0}
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Aluno</Table.Head>
							<Table.Head>Escola</Table.Head>
							<Table.Head>Turma</Table.Head>
							<Table.Head>Idade</Table.Head>
							<Table.Head>Avaliações</Table.Head>
							<Table.Head class="text-right">Ações</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each data.students as student}
							<Table.Row>
								<Table.Cell>
									<div>
										<div class="font-medium">{student.nome_completo}</div>
										<div class="text-sm text-muted-foreground">
											{student.cpf ? `CPF: ${student.cpf}` : ''}
											{student.cpf && student.ra ? ' • ' : ''}
											{student.ra ? `RA: ${student.ra}` : ''}
										</div>
									</div>
								</Table.Cell>
								<Table.Cell>{student.escola_nome}</Table.Cell>
								<Table.Cell>{student.turma || '-'}</Table.Cell>
								<Table.Cell>{calculateAge(student.data_nasc)} anos</Table.Cell>
								<Table.Cell>
									<div class="flex gap-1">
										<Badge variant={getEvaluationStatus(student).variant}>
											{getEvaluationStatus(student).text}
										</Badge>
										{#if student.has_history > 0}
											<Badge variant="outline" class="text-xs">
												<Eye class="h-3 w-3" />
												Histórico
											</Badge>
										{/if}
									</div>
								</Table.Cell>
								<Table.Cell class="text-right">
									<div class="flex items-center justify-end gap-2">
										<Button
											variant="outline"
											size="sm"
											onclick={() => viewStudent(student.aluno_id)}
										>
											<User class="mr-2 h-4 w-4" />
											Ver detalhes
										</Button>
									</div>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>

				<!-- Pagination -->
				<div class="flex items-center justify-between px-2 py-4">
					<div class="text-sm text-muted-foreground">
						Mostrando {Math.min((currentPage - 1) * data.pagination.limit + 1, data.pagination.totalStudents)}
						até {Math.min(currentPage * data.pagination.limit, data.pagination.totalStudents)}
						de {data.pagination.totalStudents} alunos
					</div>

					<div class="flex items-center space-x-2">
						<Button
							variant="outline"
							size="sm"
							onclick={goToPrevPage}
							disabled={!data.pagination.hasPrevPage}
						>
							<ChevronLeft class="h-4 w-4" />
							Anterior
						</Button>

						<div class="flex items-center space-x-1">
							{#if data.pagination.totalPages > 1}
								{#each Array.from({ length: Math.min(5, data.pagination.totalPages) }, (_, i) => i + 1) as pageNum}
									{#if pageNum === currentPage || (pageNum === 1 && currentPage > 3) || (pageNum === 5 && currentPage < data.pagination.totalPages - 2)}
										<Button
											variant={pageNum === currentPage ? 'default' : 'outline'}
											size="sm"
											onclick={() => goToPage(pageNum)}
										>
											{pageNum}
										</Button>
									{:else if (pageNum === 2 && currentPage > 3)}
										<span class="px-2">...</span>
									{:else if (pageNum === 4 && currentPage < data.pagination.totalPages - 2)}
										<span class="px-2">...</span>
									{/if}
								{/each}

								{#if currentPage > 3 && data.pagination.totalPages > 5}
									<Button
										variant={currentPage === data.pagination.totalPages ? 'default' : 'outline'}
										size="sm"
										onclick={() => goToPage(data.pagination.totalPages)}
									>
										{data.pagination.totalPages}
									</Button>
								{/if}
							{/if}
						</div>

						<Button
							variant="outline"
							size="sm"
							onclick={goToNextPage}
							disabled={!data.pagination.hasNextPage}
						>
							Próximo
							<ChevronRight class="h-4 w-4" />
						</Button>
					</div>
				</div>
			{:else}
				<div class="text-center py-12">
					<User class="mx-auto h-12 w-12 text-muted-foreground" />
					<h3 class="mt-4 text-lg font-semibold">Nenhum aluno encontrado</h3>
					<p class="mt-2 text-muted-foreground">
						Tente ajustar os filtros ou os termos de busca.
					</p>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>