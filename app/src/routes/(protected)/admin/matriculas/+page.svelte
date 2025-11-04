<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Table from '$lib/components/ui/table';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Select from '$lib/components/ui/select';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import { toast } from 'svelte-sonner';
	import {
		Search,
		ChevronLeft,
		ChevronRight,
		Settings,
		AlertCircle,
		CheckCircle2,
		Loader2,
		History,
		Calendar,
		User
	} from '@lucide/svelte';

	let { data } = $props();

	// Search and filter state
	let searchNome = $state(data.filters.nome);
	let selectedSchool = $state(data.filters.escola);
	let selectedYear = $state(data.filters.ano);
	let selectedTurma = $state(data.filters.turma);
	let currentPage = $state(data.pagination.currentPage);

	// Edit dialog state
	let showEditDialog = $state(false);
	let selectedEnrollment = $state<any>(null);
	let editForm = $state({
		escolaId: '',
		turma: '',
		periodo: '',
		anoLetivo: '',
		observacoes: ''
	});
	let isSaving = $state(false);

	// Audit log state
	let auditLogs = $state<any[]>([]);
	let isLoadingAuditLogs = $state(false);
	let showAuditLogs = $state(false);

	// Available periodo options
	const periodoOptions = [
		{ value: 'Manhã', label: 'Manhã' },
		{ value: 'Tarde', label: 'Tarde' },
		{ value: 'Integral', label: 'Integral' },
		{ value: 'Noite', label: 'Noite' }
	];

	// Build URL with current filter values
	function buildUrl(page: number = currentPage) {
		const params = new URLSearchParams();
		if (searchNome) params.set('nome', searchNome);
		if (selectedSchool) params.set('escola', selectedSchool);
		if (selectedYear) params.set('ano', selectedYear);
		if (selectedTurma) params.set('turma', selectedTurma);
		params.set('page', page.toString());
		params.set('limit', data.pagination.limit.toString());
		return `/admin/matriculas?${params.toString()}`;
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

	// Handle form submission for search
	function handleSearch(event: Event) {
		event.preventDefault();
		updateFilters();
	}

	// Handle filter changes
	function handleSchoolChange(value: string | undefined) {
		selectedSchool = value || '';
		updateFilters();
	}

	function handleYearChange(value: string | undefined) {
		selectedYear = value || '';
		updateFilters();
	}

	// Open edit dialog
	async function openEditDialog(enrollment: any) {
		selectedEnrollment = enrollment;
		editForm = {
			escolaId: enrollment.escola_id.toString(),
			turma: enrollment.turma,
			periodo: enrollment.periodo,
			anoLetivo: enrollment.ano_letivo.toString(),
			observacoes: enrollment.observacoes || ''
		};
		showEditDialog = true;
		showAuditLogs = false;
		auditLogs = [];

		// Load audit logs for this student
		await loadAuditLogs(enrollment.aluno_id);
	}

	// Close edit dialog
	function closeEditDialog() {
		showEditDialog = false;
		selectedEnrollment = null;
		editForm = {
			escolaId: '',
			turma: '',
			periodo: '',
			anoLetivo: '',
			observacoes: ''
		};
		auditLogs = [];
		showAuditLogs = false;
	}

	// Load audit logs for a student
	async function loadAuditLogs(studentId: number) {
		isLoadingAuditLogs = true;
		try {
			const response = await fetch(`/api/audit/student/${studentId}`);
			const result = await response.json();

			if (result.success) {
				auditLogs = result.logs;
			} else {
				console.error('Failed to load audit logs:', result.error);
				toast.error('Erro ao carregar histórico de alterações');
			}
		} catch (err) {
			console.error('Error loading audit logs:', err);
			toast.error('Erro ao carregar histórico de alterações');
		} finally {
			isLoadingAuditLogs = false;
		}
	}

	// Toggle audit logs visibility
	function toggleAuditLogs() {
		showAuditLogs = !showAuditLogs;
	}

	// Get field label in Portuguese
	function getFieldLabel(field: string): string {
		const labels: Record<string, string> = {
			escola_id: 'Escola',
			turma: 'Turma',
			periodo: 'Período',
			ano_letivo: 'Ano Letivo'
		};
		return labels[field] || field;
	}

	// Format field value for display
	function formatFieldValue(field: string, value: any, schools: any[]): string {
		if (value === null || value === undefined) return '-';

		if (field === 'escola_id') {
			const school = schools.find(s => s.escola_id === value);
			return school ? school.escola : value.toString();
		}

		return value.toString();
	}

	// Check if form has changes
	function hasChanges() {
		if (!selectedEnrollment) return false;
		return (
			editForm.escolaId !== selectedEnrollment.escola_id.toString() ||
			editForm.turma !== selectedEnrollment.turma ||
			editForm.periodo !== selectedEnrollment.periodo ||
			editForm.anoLetivo !== selectedEnrollment.ano_letivo.toString()
		);
	}

	// Validate form
	function validateForm() {
		if (!editForm.escolaId || !editForm.turma || !editForm.periodo || !editForm.anoLetivo) {
			toast.error('Todos os campos são obrigatórios');
			return false;
		}
		if (!hasChanges()) {
			toast.error('Nenhuma alteração foi feita');
			return false;
		}
		return true;
	}

	// Handle save enrollment changes
	async function handleSaveEnrollment(event: Event) {
		event.preventDefault();

		if (!validateForm()) {
			return;
		}

		// Check if changing schools - show confirmation
		const isChangingSchool = editForm.escolaId !== selectedEnrollment.escola_id.toString();
		if (isChangingSchool) {
			const confirmed = confirm(
				'Você está alterando a escola do aluno. Deseja continuar?'
			);
			if (!confirmed) {
				return;
			}
		}

		isSaving = true;

		try {
			const response = await fetch('/api/enrollment/update', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					enrollmentId: selectedEnrollment.enrollment_id,
					escolaId: parseInt(editForm.escolaId),
					turma: editForm.turma,
					periodo: editForm.periodo,
					anoLetivo: parseInt(editForm.anoLetivo),
					observacoes: editForm.observacoes || null
				})
			});

			const result = await response.json();

			if (!response.ok || !result.success) {
				throw new Error(result.error || 'Erro ao atualizar matrícula');
			}

			toast.success('Matrícula atualizada com sucesso!');
			closeEditDialog();

			// Reload page to show updated data
			goto(buildUrl(currentPage), { invalidateAll: true });
		} catch (err) {
			console.error('Error updating enrollment:', err);
			toast.error(err instanceof Error ? err.message : 'Erro ao atualizar matrícula');
		} finally {
			isSaving = false;
		}
	}

	// Format date for display
	function formatDate(dateString: string | Date) {
		const date = new Date(dateString);
		return date.toLocaleDateString('pt-BR');
	}
</script>

<div class="container mx-auto p-8 lg:p-6 md:p-4 space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Gerenciamento de Matrículas</h1>
			<p class="text-muted-foreground">
				Buscar e gerenciar matrículas de alunos
			</p>
		</div>
		<Badge variant="outline">
			{data.pagination.totalEnrollments} matrículas
		</Badge>
	</div>

	<!-- Filters Card -->
	<Card.Root>
		<Card.Header>
			<Card.Title>Filtros de Busca</Card.Title>
			<Card.Description>
				Use os filtros abaixo para encontrar matrículas específicas
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<form class="grid grid-cols-4 gap-4 lg:grid-cols-2 md:grid-cols-1" onsubmit={handleSearch}>
				<div class="space-y-2">
					<label for="nome" class="text-sm font-medium">Nome do Aluno</label>
					<div class="relative">
						<Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
						<Input
							id="nome"
							bind:value={searchNome}
							placeholder="Digite o nome do aluno..."
							class="pl-8"
						/>
					</div>
				</div>

				<div class="space-y-2">
					<label for="escola" class="text-sm font-medium">Escola</label>
					<Select.Root type="single" value={selectedSchool} onValueChange={handleSchoolChange}>
						<Select.Trigger id="escola">
							{selectedSchool
								? data.schools.find((s) => s.escola_id.toString() === selectedSchool)?.escola ||
									'Todas as escolas'
								: 'Todas as escolas'}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="" label="Todas as escolas">Todas as escolas</Select.Item>
							{#each data.schools as school}
								<Select.Item
									value={school.escola_id.toString()}
									label={school.escola}
								>
									{school.escola}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>

				<div class="space-y-2">
					<label for="ano" class="text-sm font-medium">Ano Letivo</label>
					<Select.Root type="single" value={selectedYear} onValueChange={handleYearChange}>
						<Select.Trigger id="ano">
							{selectedYear || 'Selecione o ano'}
						</Select.Trigger>
						<Select.Content>
							{#each data.years as year}
								<Select.Item
									value={year.ano_letivo.toString()}
									label={year.ano_letivo.toString()}
								>
									{year.ano_letivo}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>

				<div class="space-y-2">
					<label for="turma" class="text-sm font-medium">Turma</label>
					<Input
						id="turma"
						bind:value={selectedTurma}
						placeholder="Digite a turma..."
					/>
				</div>

				<div class="col-span-4 lg:col-span-2 md:col-span-1 flex justify-end">
					<Button type="submit" class="w-full md:w-auto">
						<Search class="mr-2 h-4 w-4" />
						Buscar
					</Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>

	<!-- Enrollments Table -->
	<Card.Root>
		<Card.Content class="pt-6">
			{#if data.enrollments.length > 0}
				<div class="overflow-x-auto">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Aluno</Table.Head>
								<Table.Head>Escola</Table.Head>
								<Table.Head>Turma</Table.Head>
								<Table.Head>Período</Table.Head>
								<Table.Head>Ano Letivo</Table.Head>
								<Table.Head class="text-right">Ações</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each data.enrollments as enrollment}
								<Table.Row>
									<Table.Cell>
										<div>
											<div class="font-medium">{enrollment.nome_completo}</div>
											{#if enrollment.data_nasc}
												<div class="text-sm text-muted-foreground">
													Nascimento: {formatDate(enrollment.data_nasc)}
												</div>
											{/if}
										</div>
									</Table.Cell>
									<Table.Cell>{enrollment.escola_nome}</Table.Cell>
									<Table.Cell>{enrollment.turma}</Table.Cell>
									<Table.Cell>
										<Badge variant="outline">{enrollment.periodo}</Badge>
									</Table.Cell>
									<Table.Cell>{enrollment.ano_letivo}</Table.Cell>
									<Table.Cell class="text-right">
										<Button
											variant="outline"
											size="sm"
											onclick={() => openEditDialog(enrollment)}
										>
											<Settings class="mr-2 h-4 w-4" />
											Gerenciar Matrícula
										</Button>
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</div>

				<!-- Pagination -->
				<div class="flex items-center justify-between px-2 py-4 border-t mt-4">
					<div class="text-sm text-muted-foreground">
						Mostrando {Math.min(
							(currentPage - 1) * data.pagination.limit + 1,
							data.pagination.totalEnrollments
						)}
						até {Math.min(
							currentPage * data.pagination.limit,
							data.pagination.totalEnrollments
						)}
						de {data.pagination.totalEnrollments} matrículas
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
									<Button
										variant={pageNum === currentPage ? 'default' : 'outline'}
										size="sm"
										onclick={() => goToPage(pageNum)}
									>
										{pageNum}
									</Button>
								{/each}
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
					<AlertCircle class="mx-auto h-12 w-12 text-muted-foreground" />
					<h3 class="mt-4 text-lg font-semibold">Nenhuma matrícula encontrada</h3>
					<p class="mt-2 text-muted-foreground">
						Tente ajustar os filtros ou os termos de busca.
					</p>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>

<!-- Edit Enrollment Dialog -->
<Dialog.Root bind:open={showEditDialog}>
	<Dialog.Content class="sm:max-w-[600px]">
		<Dialog.Header>
			<Dialog.Title>Editar Matrícula</Dialog.Title>
			<Dialog.Description>
				Alterar escola, turma ou período do aluno
			</Dialog.Description>
		</Dialog.Header>

		{#if selectedEnrollment}
			<!-- Current enrollment (read-only display) -->
			<div class="bg-muted p-4 rounded-md mb-4">
				<h4 class="font-semibold mb-2">Matrícula Atual:</h4>
				<div class="grid grid-cols-2 gap-2 text-sm">
					<div>
						<span class="text-muted-foreground">Aluno:</span>
						<span class="font-medium ml-2">{selectedEnrollment.nome_completo}</span>
					</div>
					<div>
						<span class="text-muted-foreground">Escola:</span>
						<span class="font-medium ml-2">{selectedEnrollment.escola_nome}</span>
					</div>
					<div>
						<span class="text-muted-foreground">Turma:</span>
						<span class="font-medium ml-2">{selectedEnrollment.turma}</span>
					</div>
					<div>
						<span class="text-muted-foreground">Período:</span>
						<span class="font-medium ml-2">{selectedEnrollment.periodo}</span>
					</div>
				</div>
			</div>

			<!-- Edit form -->
			<form onsubmit={handleSaveEnrollment}>
				<div class="space-y-4">
					<div class="space-y-2">
						<label for="edit-escola" class="text-sm font-medium">Escola</label>
						<Select.Root
							type="single"
							value={editForm.escolaId}
							onValueChange={(value) => (editForm.escolaId = value || '')}
						>
							<Select.Trigger id="edit-escola">
								{editForm.escolaId
									? data.schools.find((s) => s.escola_id.toString() === editForm.escolaId)
											?.escola || 'Selecione a escola'
									: 'Selecione a escola'}
							</Select.Trigger>
							<Select.Content>
								{#each data.schools as school}
									<Select.Item
										value={school.escola_id.toString()}
										label={school.escola}
									>
										{school.escola}
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					<div class="space-y-2">
						<label for="edit-turma" class="text-sm font-medium">Turma</label>
						<Input id="edit-turma" bind:value={editForm.turma} placeholder="Nome da turma" required />
					</div>

					<div class="space-y-2">
						<label for="edit-periodo" class="text-sm font-medium">Período</label>
						<Select.Root
							type="single"
							value={editForm.periodo}
							onValueChange={(value) => (editForm.periodo = value || '')}
						>
							<Select.Trigger id="edit-periodo">
								{editForm.periodo || 'Selecione o período'}
							</Select.Trigger>
							<Select.Content>
								{#each periodoOptions as periodo}
									<Select.Item value={periodo.value} label={periodo.label}>
										{periodo.label}
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					<div class="space-y-2">
						<label for="edit-ano" class="text-sm font-medium">Ano Letivo</label>
						<Select.Root
							type="single"
							value={editForm.anoLetivo}
							onValueChange={(value) => (editForm.anoLetivo = value || '')}
						>
							<Select.Trigger id="edit-ano">
								{editForm.anoLetivo || 'Selecione o ano'}
							</Select.Trigger>
							<Select.Content>
								{#each data.years as year}
									<Select.Item
										value={year.ano_letivo.toString()}
										label={year.ano_letivo.toString()}
									>
										{year.ano_letivo}
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					<div class="space-y-2">
						<label for="edit-observacoes" class="text-sm font-medium">Observações (opcional)</label>
						<Input
							id="edit-observacoes"
							bind:value={editForm.observacoes}
							placeholder="Observações sobre a matrícula..."
						/>
					</div>
				</div>

				<Dialog.Footer class="mt-6">
					<Button type="button" variant="outline" onclick={closeEditDialog} disabled={isSaving}>
						Cancelar
					</Button>
					<Button type="submit" disabled={isSaving || !hasChanges()}>
						{#if isSaving}
							<Loader2 class="mr-2 h-4 w-4 animate-spin" />
							Salvando...
						{:else}
							<CheckCircle2 class="mr-2 h-4 w-4" />
							Salvar Alterações
						{/if}
					</Button>
				</Dialog.Footer>
			</form>

			<!-- Audit Log Viewer -->
			<div class="mt-6 border-t pt-4">
				<div class="flex items-center justify-between mb-4">
					<div class="flex items-center gap-2">
						<History class="h-5 w-5 text-muted-foreground" />
						<h4 class="font-semibold">Histórico de Alterações</h4>
						{#if auditLogs.length > 0}
							<Badge variant="secondary">{auditLogs.length}</Badge>
						{/if}
					</div>
					<Button
						variant="ghost"
						size="sm"
						onclick={toggleAuditLogs}
						disabled={isLoadingAuditLogs}
					>
						{showAuditLogs ? 'Ocultar' : 'Mostrar'}
					</Button>
				</div>

				{#if showAuditLogs}
					{#if isLoadingAuditLogs}
						<div class="flex items-center justify-center py-8">
							<Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
							<span class="ml-2 text-sm text-muted-foreground">Carregando histórico...</span>
						</div>
					{:else if auditLogs.length === 0}
						<div class="text-center py-8 text-muted-foreground">
							<p class="text-sm">Nenhuma alteração registrada</p>
						</div>
					{:else}
						<div class="space-y-4 max-h-96 overflow-y-auto">
							{#each auditLogs as log}
								<Card.Root class="border-l-4 border-l-primary">
									<Card.Content class="p-4">
										<div class="flex items-start justify-between mb-3">
											<div class="flex items-center gap-2">
												<User class="h-4 w-4 text-muted-foreground" />
												<span class="font-medium text-sm">{log.changed_by_name}</span>
											</div>
											<div class="flex items-center gap-1 text-xs text-muted-foreground">
												<Calendar class="h-3 w-3" />
												{new Date(log.changed_at).toLocaleString('pt-BR')}
											</div>
										</div>

										<div class="space-y-2">
											<p class="text-xs font-semibold text-muted-foreground uppercase">
												Alteração: {log.action_type}
											</p>

											<div class="grid grid-cols-2 gap-4 text-sm">
												<div>
													<p class="font-semibold mb-2 text-xs text-muted-foreground">
														Valores Anteriores:
													</p>
													<div class="space-y-1">
														{#if log.old_values}
															{#each Object.entries(log.old_values) as [key, value]}
																<div class="flex justify-between">
																	<span class="text-muted-foreground">{getFieldLabel(key)}:</span>
																	<span class="font-medium">
																		{formatFieldValue(key, value, data.schools)}
																	</span>
																</div>
															{/each}
														{:else}
															<span class="text-muted-foreground text-xs">-</span>
														{/if}
													</div>
												</div>

												<div>
													<p class="font-semibold mb-2 text-xs text-muted-foreground">
														Valores Novos:
													</p>
													<div class="space-y-1">
														{#if log.new_values}
															{#each Object.entries(log.new_values) as [key, value]}
																<div class="flex justify-between">
																	<span class="text-muted-foreground">{getFieldLabel(key)}:</span>
																	<span class="font-medium">
																		{formatFieldValue(key, value, data.schools)}
																	</span>
																</div>
															{/each}
														{:else}
															<span class="text-muted-foreground text-xs">-</span>
														{/if}
													</div>
												</div>
											</div>
										</div>
									</Card.Content>
								</Card.Root>
							{/each}
						</div>
					{/if}
				{/if}
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>
