<script lang="ts">
	import type { PageData } from './$types';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';

	let { data }: { data: PageData } = $props();

	// Export state
	let isExporting = $state(false);

	// Filter state using Svelte 5 runes
	interface FilterState {
		escolaId: string;
		anoLetivo: number;
		turma?: string;
		periodo: string;
		evaluationTypes: {
			anthropometric: boolean;
			visual: boolean;
			dental: boolean;
		};
		cdcClassifications: {
			'Abaixo do Peso': boolean;
			'Peso Normal': boolean;
			Sobrepeso: boolean;
			Obesidade: boolean;
			'Obesidade Grave': boolean;
		};
		visualAcuityRange: string;
		dentalRisks: Record<string, boolean>;
	}

	// Initialize filters from page data (server-loaded URL params)
	let filters = $state<FilterState>({
		escolaId: data.results.length > 0 && data.results[0]?.escola_id
			? data.results[0].escola_id.toString()
			: '',
		anoLetivo: data.currentYear,
		turma: undefined,
		periodo: '',
		visualAcuityRange: '',
		evaluationTypes: {
			anthropometric: false,
			visual: false,
			dental: false
		},
		cdcClassifications: {
			'Abaixo do Peso': false,
			'Peso Normal': false,
			Sobrepeso: false,
			Obesidade: false,
			'Obesidade Grave': false
		},
		dentalRisks: {
			A: false,
			B: false,
			C: false,
			D: false,
			E: false,
			F: false,
			G: false
		}
	});

	// Sync filters from URL on client-side mount
	$effect(() => {
		if (typeof window !== 'undefined') {
			const params = new URLSearchParams(window.location.search);
			if (params.has('escolaId')) filters.escolaId = params.get('escolaId') || '';
			if (params.has('anoLetivo')) filters.anoLetivo = parseInt(params.get('anoLetivo')!) || data.currentYear;
			if (params.has('turma')) filters.turma = params.get('turma') || undefined;
			if (params.has('periodo')) filters.periodo = params.get('periodo') || '';
			if (params.has('visualAcuityRange')) filters.visualAcuityRange = params.get('visualAcuityRange') || '';
		}
	});

	// School options
	const schoolOptions = $derived(
		data.schools.map((s) => ({ value: s.inep.toString(), label: s.escola }))
	);
	const schoolTriggerContent = $derived(
		schoolOptions.find((s) => s.value === filters.escolaId)?.label ?? 'Todas as escolas'
	);

	// Dynamic period options based on selected school
	let availablePeriods = $state<string[]>([]);
	let loadingPeriods = $state(false);

	// All possible period options (fallback when no school selected)
	const allPeriodOptions = [
		{ value: 'MANHA', label: 'Manhã' },
		{ value: 'TARDE', label: 'Tarde' },
		{ value: 'INTEGRAL', label: 'Integral' },
		{ value: 'NOITE', label: 'Noite' }
	];

	// Period options derived from available periods or all options
	const periodOptions = $derived(
		availablePeriods.length > 0
			? availablePeriods.map((p) => ({
					value: p,
					label:
						p === 'MANHA'
							? 'Manhã'
							: p === 'TARDE'
								? 'Tarde'
								: p === 'INTEGRAL'
									? 'Integral'
									: p === 'NOITE'
										? 'Noite'
										: p
				}))
			: allPeriodOptions
	);

	const periodTriggerContent = $derived(
		periodOptions.find((p) => p.value === filters.periodo)?.label ?? 'Todos os períodos'
	);

	// Fetch periods when school changes
	async function fetchPeriodsForSchool(escolaId: string) {
		if (!escolaId) {
			availablePeriods = [];
			return;
		}

		loadingPeriods = true;
		try {
			const response = await fetch(
				`/api/escolas/${escolaId}/periodos?anoLetivo=${filters.anoLetivo}`
			);
			if (response.ok) {
				const data = await response.json();
				availablePeriods = data.periods || [];

				// Reset period filter if current selection not available
				if (filters.periodo && !availablePeriods.includes(filters.periodo)) {
					filters.periodo = '';
				}
			}
		} catch (error) {
			console.error('Error fetching periods:', error);
			availablePeriods = [];
		} finally {
			loadingPeriods = false;
		}
	}

	// Watch for school changes
	$effect(() => {
		if (filters.escolaId) {
			fetchPeriodsForSchool(filters.escolaId);
		} else {
			availablePeriods = [];
		}
	});

	// Visual acuity range options
	const visualAcuityRangeOptions = [
		{ value: '<= 0.6', label: '<= 0.6 (Baixa)' },
		{ value: '0.61-0.9', label: '0.61-0.9 (Moderada)' },
		{ value: '>= 1.0', label: '>= 1.0 (Normal)' }
	];
	const visualAcuityTriggerContent = $derived(
		visualAcuityRangeOptions.find((v) => v.value === filters.visualAcuityRange)?.label ??
			'Todas as faixas'
	);

	function handleApplyFilters() {
		// Build URL search params from filters
		const params = new URLSearchParams();

		if (filters.escolaId) params.set('escolaId', filters.escolaId);
		params.set('anoLetivo', filters.anoLetivo.toString());
		if (filters.turma) params.set('turma', filters.turma);
		if (filters.periodo) params.set('periodo', filters.periodo);

		// Add visual acuity range filter
		if (filters.visualAcuityRange) params.set('visualAcuityRange', filters.visualAcuityRange);

		params.set('page', '1'); // Reset to first page

		// Navigate with filters
		window.location.href = `/gestor/relatorios?${params.toString()}`;
	}

	function handleClearFilters() {
		// Navigate to base URL without filters
		window.location.href = '/gestor/relatorios';
	}

	function formatDate(date: Date): string {
		return new Date(date).toLocaleDateString('pt-BR');
	}

	async function handleExportToExcel() {
		isExporting = true;

		try {
			// Build filter payload from current filters (matching URL params or filter state)
			const searchParams = new URLSearchParams(window.location.search);
			const payload: Record<string, any> = {};

			// Always include anoLetivo (from URL or current filter state)
			payload.anoLetivo = searchParams.has('anoLetivo')
				? parseInt(searchParams.get('anoLetivo')!)
				: filters.anoLetivo;

			// Get other filters from URL params
			if (searchParams.has('escolaId')) {
				payload.escolaId = parseInt(searchParams.get('escolaId')!);
			}
			if (searchParams.has('turma')) {
				payload.turma = searchParams.get('turma');
			}
			if (searchParams.has('periodo')) {
				payload.periodo = searchParams.get('periodo');
			}
			if (searchParams.has('visualAcuityRange')) {
				payload.visualAcuityRange = searchParams.get('visualAcuityRange');
			}

			// Add evaluation types and health risk filters if active
			const evaluationTypes: string[] = [];
			if (filters.evaluationTypes.anthropometric) evaluationTypes.push('anthropometric');
			if (filters.evaluationTypes.visual) evaluationTypes.push('visual');
			if (filters.evaluationTypes.dental) evaluationTypes.push('dental');
			if (evaluationTypes.length > 0) {
				payload.evaluationTypes = evaluationTypes;
			}

			// CDC Classifications
			const cdcClassifications = Object.entries(filters.cdcClassifications)
				.filter(([_, checked]) => checked)
				.map(([key]) => key);
			if (cdcClassifications.length > 0) {
				payload.cdcClassification = cdcClassifications;
			}

			// Visual Acuity Range
			if (filters.visualAcuityRange) {
				payload.visualAcuityRange = filters.visualAcuityRange;
			}

			// Dental Risks
			const dentalRisks = Object.entries(filters.dentalRisks)
				.filter(([_, checked]) => checked)
				.map(([key]) => key);
			if (dentalRisks.length > 0) {
				payload.dentalRisk = dentalRisks;
			}

			// Call export API
			const response = await fetch('/api/export/relatorios', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(payload)
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(errorText || 'Erro ao exportar relatório');
			}

			// Download the file
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || `relatorio-pse-${new Date().toISOString().split('T')[0]}.xlsx`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		} catch (error) {
			console.error('Erro ao exportar:', error);
			alert('Erro ao exportar relatório. Por favor, tente novamente.');
		} finally {
			isExporting = false;
		}
	}
</script>

<div class="container mx-auto p-8">
	<!-- Page Header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900">Relatórios</h1>
		<p class="mt-2 text-gray-600">
			Filtre a base de dados dos alunos por múltiplos critérios e exporte listas específicas para
			ações de saúde
		</p>
	</div>

	<!-- Filter Section -->
	<Card.Root class="mb-8">
		<Card.Header>
			<Card.Title>Filtros</Card.Title>
			<Card.Description>Selecione os critérios para filtrar os alunos</Card.Description>
		</Card.Header>
		<Card.Content>
			<form
				class="space-y-6"
				onsubmit={(e) => {
					e.preventDefault();
					handleApplyFilters();
				}}
			>
				<!-- Basic Filters Grid -->
				<div
					class="grid grid-cols-4 gap-6 2xl:grid-cols-3 xl:grid-cols-2 lg:grid-cols-2 md:grid-cols-1"
				>
					<!-- School Filter -->
					<div class="space-y-2">
						<Label for="school">Escola</Label>
						<Select.Root type="single" bind:value={filters.escolaId}>
							<Select.Trigger id="school" class="w-full">
								{schoolTriggerContent}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="">Todas as escolas</Select.Item>
								{#each schoolOptions as school (school.value)}
									<Select.Item value={school.value} label={school.label}>
										{school.label}
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					<!-- Year Filter -->
					<div class="space-y-2">
						<Label for="year">Ano Letivo</Label>
						<Input
							id="year"
							type="number"
							bind:value={filters.anoLetivo}
							placeholder="Ex: 2025"
							min="2020"
							max="2030"
						/>
					</div>

					<!-- Class/Turma Filter -->
					<div class="space-y-2">
						<Label for="class">Turma</Label>
						<Input
							id="class"
							type="text"
							bind:value={filters.turma}
							placeholder="Ex: 5º Ano A"
						/>
					</div>

					<!-- Period Filter -->
					<div class="space-y-2">
						<Label for="period">Período</Label>
						<Select.Root type="single" bind:value={filters.periodo} disabled={loadingPeriods}>
							<Select.Trigger id="period" class="w-full">
								{#if loadingPeriods}
									Carregando...
								{:else}
									{periodTriggerContent}
								{/if}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="">Todos os períodos</Select.Item>
								{#each periodOptions as period (period.value)}
									<Select.Item value={period.value} label={period.label}>
										{period.label}
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
						{#if filters.escolaId && availablePeriods.length === 0 && !loadingPeriods}
							<p class="text-xs text-gray-500">Nenhum período disponível para esta escola</p>
						{/if}
					</div>
				</div>

				<!-- Evaluation Types -->
				<div class="space-y-3">
					<Label>Tipos de Avaliação</Label>
					<div class="flex flex-wrap gap-6">
						<div class="flex items-center space-x-2">
							<Checkbox
								id="eval-anthropometric"
								bind:checked={filters.evaluationTypes.anthropometric}
							/>
							<Label for="eval-anthropometric" class="cursor-pointer font-normal"
								>Antropométrica</Label
							>
						</div>
						<div class="flex items-center space-x-2">
							<Checkbox id="eval-visual" bind:checked={filters.evaluationTypes.visual} />
							<Label for="eval-visual" class="cursor-pointer font-normal">Acuidade Visual</Label>
						</div>
						<div class="flex items-center space-x-2">
							<Checkbox id="eval-dental" bind:checked={filters.evaluationTypes.dental} />
							<Label for="eval-dental" class="cursor-pointer font-normal">Odontológica</Label>
						</div>
					</div>
				</div>

				<!-- Health Risk Filters (Conditional based on evaluation types) -->
				{#if filters.evaluationTypes.anthropometric}
					<div class="space-y-3">
						<Label>Classificação CDC (Antropométrica)</Label>
						<div class="flex flex-wrap gap-6">
							<div class="flex items-center space-x-2">
								<Checkbox
									id="cdc-abaixo-peso"
									bind:checked={filters.cdcClassifications['Abaixo do Peso']}
								/>
								<Label for="cdc-abaixo-peso" class="cursor-pointer font-normal"
									>Abaixo do Peso</Label
								>
							</div>
							<div class="flex items-center space-x-2">
								<Checkbox
									id="cdc-peso-normal"
									bind:checked={filters.cdcClassifications['Peso Normal']}
								/>
								<Label for="cdc-peso-normal" class="cursor-pointer font-normal">Peso Normal</Label>
							</div>
							<div class="flex items-center space-x-2">
								<Checkbox
									id="cdc-sobrepeso"
									bind:checked={filters.cdcClassifications.Sobrepeso}
								/>
								<Label for="cdc-sobrepeso" class="cursor-pointer font-normal">Sobrepeso</Label>
							</div>
							<div class="flex items-center space-x-2">
								<Checkbox
									id="cdc-obesidade"
									bind:checked={filters.cdcClassifications.Obesidade}
								/>
								<Label for="cdc-obesidade" class="cursor-pointer font-normal">Obesidade</Label>
							</div>
							<div class="flex items-center space-x-2">
								<Checkbox
									id="cdc-obesidade-grave"
									bind:checked={filters.cdcClassifications['Obesidade Grave']}
								/>
								<Label for="cdc-obesidade-grave" class="cursor-pointer font-normal"
									>Obesidade Grave</Label
								>
							</div>
						</div>
					</div>
				{/if}

				{#if filters.evaluationTypes.visual}
					<div class="space-y-2">
						<Label for="visual-acuity">Faixa de Acuidade Visual</Label>
						<Select.Root type="single" bind:value={filters.visualAcuityRange}>
							<Select.Trigger id="visual-acuity" class="w-full">
								{visualAcuityTriggerContent}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="">Todas as faixas</Select.Item>
								{#each visualAcuityRangeOptions as range (range.value)}
									<Select.Item value={range.value} label={range.label}>
										{range.label}
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				{/if}

				{#if filters.evaluationTypes.dental}
					<div class="space-y-3">
						<Label>Risco Odontológico</Label>
						<div class="flex flex-wrap gap-6">
							{#each ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as risk}
								<div class="flex items-center space-x-2">
									<Checkbox id="dental-risk-{risk}" bind:checked={filters.dentalRisks[risk]} />
									<Label for="dental-risk-{risk}" class="cursor-pointer font-normal"
										>Risco {risk}</Label
									>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Action Buttons -->
				<div class="flex gap-4">
					<Button type="submit">Aplicar Filtros</Button>
					<Button type="button" variant="outline" onclick={handleClearFilters}
						>Limpar Filtros</Button
					>
				</div>
			</form>
		</Card.Content>
	</Card.Root>

	<!-- Results Section -->
	<Card.Root>
		<Card.Header>
			<div class="flex items-center justify-between">
				<div>
					<Card.Title>Resultados</Card.Title>
					<Card.Description>
						{#if data.total > 0}
							Mostrando {(data.page - 1) * 25 + 1}-{Math.min(data.page * 25, data.total)} de {data.total}
							{data.total === 1 ? 'aluno' : 'alunos'}
						{:else}
							Nenhum aluno encontrado
						{/if}
					</Card.Description>
				</div>
				{#if data.total > 0}
					<Button variant="outline" onclick={handleExportToExcel} disabled={isExporting}>
						{#if isExporting}
							<span class="mr-2">⏳</span>
							Exportando...
						{:else}
							<span class="mr-2">📥</span>
							Exportar para Excel
						{/if}
					</Button>
				{/if}
			</div>
		</Card.Header>
		<Card.Content>
			{#if data.results.length === 0}
				<div class="flex flex-col items-center justify-center py-12 text-center">
					<p class="text-sm text-gray-500">
						Nenhum resultado encontrado com os filtros selecionados.
					</p>
					<p class="mt-2 text-sm text-gray-400">
						Tente ajustar os critérios de filtro ou limpar os filtros.
					</p>
				</div>
			{:else}
				<div class="rounded-md border">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head class="w-[250px]">Nome</Table.Head>
								<Table.Head>Data Nasc.</Table.Head>
								<Table.Head>Sexo</Table.Head>
								<Table.Head>Escola</Table.Head>
								<Table.Head>Turma</Table.Head>
								<Table.Head>Período</Table.Head>
								<Table.Head class="text-center">Avaliações</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each data.results as student (student.aluno_id)}
								<Table.Row>
									<Table.Cell class="font-medium">{student.cliente}</Table.Cell>
									<Table.Cell>{formatDate(student.data_nasc)}</Table.Cell>
									<Table.Cell>{student.sexo}</Table.Cell>
									<Table.Cell class="max-w-[200px] truncate" title={student.escola_nome}>
										{student.escola_nome}
									</Table.Cell>
									<Table.Cell>{student.turma}</Table.Cell>
									<Table.Cell>
										{#if student.periodo === 'MANHA'}
											Manhã
										{:else if student.periodo === 'TARDE'}
											Tarde
										{:else if student.periodo === 'INTEGRAL'}
											Integral
										{:else if student.periodo === 'NOITE'}
											Noite
										{:else}
											{student.periodo}
										{/if}
									</Table.Cell>
									<Table.Cell>
										<div class="flex justify-center gap-2">
											{#if student.has_anthropometric}
												<Badge variant="default" class="text-xs">Antrop.</Badge>
											{/if}
											{#if student.has_visual}
												<Badge variant="secondary" class="text-xs">Visual</Badge>
											{/if}
											{#if student.has_dental}
												<Badge variant="outline" class="text-xs">Dental</Badge>
											{/if}
											{#if !student.has_anthropometric && !student.has_visual && !student.has_dental}
												<span class="text-xs text-gray-400">-</span>
											{/if}
										</div>
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</div>

				<!-- Pagination Controls -->
				{#if data.totalPages > 1}
					<div class="mt-6 flex items-center justify-between">
						<div class="text-sm text-gray-600">
							Página {data.page} de {data.totalPages}
						</div>
						<div class="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								disabled={data.page === 1}
								onclick={() => {
									const params = new URLSearchParams(window.location.search);
									params.set('page', String(data.page - 1));
									window.location.href = `/gestor/relatorios?${params.toString()}`;
								}}
							>
								Anterior
							</Button>
							<Button
								variant="outline"
								size="sm"
								disabled={data.page === data.totalPages}
								onclick={() => {
									const params = new URLSearchParams(window.location.search);
									params.set('page', String(data.page + 1));
									window.location.href = `/gestor/relatorios?${params.toString()}`;
								}}
							>
								Próxima
							</Button>
						</div>
					</div>
				{/if}
			{/if}
		</Card.Content>
	</Card.Root>
</div>
