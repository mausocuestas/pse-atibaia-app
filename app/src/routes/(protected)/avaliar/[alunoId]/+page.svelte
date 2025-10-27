<script lang="ts">
	import type { PageData } from './$types';
	import EvaluationHeader from '$lib/components/app/EvaluationHeader.svelte';
	import EvaluationFooter from '$lib/components/app/EvaluationFooter.svelte';
	import AnthropometryForm from '$lib/components/app/AnthropometryForm.svelte';
	import VisualAcuityForm from '$lib/components/app/VisualAcuityForm.svelte';
	import DentalEvaluationForm from '$lib/components/app/DentalEvaluationForm.svelte';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import { formatPeriod, calculateAge } from '$lib/utils/periods';
	import { toast } from 'svelte-sonner';
	import { localEvaluationStore, type LocalEvaluationData } from '$lib/stores/local-evaluation-store.svelte';
	import { onMount } from 'svelte';

	let { data }: { data: PageData } = $props();

	// State management
	let alunoAusente = $state(false);
	let activeTab = $state('antropometria');
	let isSaving = $state(false);
	let isInitialized = $state(false);

	// Calculate age using shared utility function
	const age = $derived(calculateAge(data.student.data_nasc!));

	// Anthropometry form state
	let anthropometryData = $state({
		pesoKg: data.anthropometry?.peso_kg ?? null,
		alturaCm: data.anthropometry?.altura_cm ?? null,
		observacoes: data.anthropometry?.observacoes ?? ''
	});

	// Visual acuity form state
	let visualAcuityData = $state({
		olhoDireito: data.visualAcuity?.olho_direito ?? null,
		olhoEsquerdo: data.visualAcuity?.olho_esquerdo ?? null,
		olhoDireitoReteste: data.visualAcuity?.olho_direito_reteste ?? null,
		olhoEsquerdoReteste: data.visualAcuity?.olho_esquerdo_reteste ?? null,
		observacoes: data.visualAcuity?.observacoes ?? ''
	});

	// Dental evaluation form state
	let dentalData = $state({
		risco: data.dental?.risco ?? null,
		complemento: data.dental?.complemento ?? null,
		classificacaoCompleta: data.dental?.classificacao_completa ?? null,
		receberATF: data.dental?.recebeu_atf ?? false,
		precisaART: data.dental?.precisa_art ?? false,
		qtdeDentesART: data.dental?.qtde_dentes_art ?? 0,
		hasEscovacao: data.dental?.has_escovacao ?? false,
		observacoes: data.dental?.observacoes ?? ''
	});

	// Track previous student to detect changes
	let previousStudentId = $state<number | null>(null);

	// Initialize local storage on mount
	onMount(async () => {
		await localEvaluationStore.init();
		await loadLocalDataIfExists();
		isInitialized = true;
	});

	// Load local data if it exists (prioritize local over server if newer)
	async function loadLocalDataIfExists() {
		const localData = await localEvaluationStore.loadEvaluation(data.student.id);

		if (!localData) {
			console.log('ℹ️ No local data found for student', data.student.id);
			return;
		}

		console.log('📦 Found local data for student', data.student.id, localData);

		// Check if local data is newer than server data (conflict resolution)
		const hasServerData = data.anthropometry || data.visualAcuity || data.dental;
		const localTimestamp = localData.timestamp;
		const timeDiffMinutes = hasServerData ? (Date.now() - localTimestamp) / 1000 / 60 : 0;

		// If server has data and local is significantly older (>5 minutes), use server data
		if (hasServerData && timeDiffMinutes > 5) {
			console.log('⚠️ Server data is newer, ignoring local data');
			return;
		}

		// Restore local data to form
		alunoAusente = localData.alunoAusente;

		if (localData.anthropometry) {
			anthropometryData.pesoKg = localData.anthropometry.peso_kg;
			anthropometryData.alturaCm = localData.anthropometry.altura_cm;
			anthropometryData.observacoes = localData.anthropometry.classificacao_cdc || '';
		}

		if (localData.visualAcuity) {
			visualAcuityData.olhoDireito = localData.visualAcuity.olho_direito;
			visualAcuityData.olhoEsquerdo = localData.visualAcuity.olho_esquerdo;
			visualAcuityData.olhoDireitoReteste = localData.visualAcuity.reteste;
			visualAcuityData.olhoEsquerdoReteste = null; // Legacy data doesn't have separate reteste
			visualAcuityData.observacoes = '';
		}

		if (localData.dental) {
			dentalData.risco = localData.dental.risco;
			dentalData.complemento = localData.dental.complemento;
			dentalData.classificacaoCompleta = localData.dental.classificacao_completa;
			dentalData.receberATF = localData.dental.recebeu_atf;
			dentalData.precisaART = localData.dental.precisa_art;
			dentalData.qtdeDentesART = localData.dental.qtde_dentes_art;
			dentalData.hasEscovacao = localData.dental.has_escovacao;
			dentalData.observacoes = localData.dental.observacoes || '';
		}

		toast.info('Dados restaurados do armazenamento local', {
			duration: 3000
		});
	}

	// Reset form data when student changes (but preserve active tab)
	$effect(() => {
		const currentStudentId = data.student.id;

		console.log('🔄 Effect triggered - Student:', data.student.cliente, 'ID:', currentStudentId);
		console.log('📊 Visual Acuity from server:', data.visualAcuity);
		console.log('📏 Anthropometry from server:', data.anthropometry);

		// Only reset if student actually changed
		if (previousStudentId !== null && previousStudentId !== currentStudentId) {
			console.log('🔀 Student changed from', previousStudentId, 'to', currentStudentId);

			// Load data for new student
			anthropometryData.pesoKg = data.anthropometry?.peso_kg ?? null;
			anthropometryData.alturaCm = data.anthropometry?.altura_cm ?? null;
			anthropometryData.observacoes = data.anthropometry?.observacoes ?? '';

			visualAcuityData.olhoDireito = data.visualAcuity?.olho_direito ?? null;
			visualAcuityData.olhoEsquerdo = data.visualAcuity?.olho_esquerdo ?? null;
			visualAcuityData.olhoDireitoReteste = data.visualAcuity?.olho_direito_reteste ?? null;
			visualAcuityData.olhoEsquerdoReteste = data.visualAcuity?.olho_esquerdo_reteste ?? null;
			visualAcuityData.observacoes = data.visualAcuity?.observacoes ?? '';

			dentalData.risco = data.dental?.risco ?? null;
			dentalData.complemento = data.dental?.complemento ?? null;
			dentalData.classificacaoCompleta = data.dental?.classificacao_completa ?? null;
			dentalData.receberATF = data.dental?.recebeu_atf ?? false;
			dentalData.precisaART = data.dental?.precisa_art ?? false;
			dentalData.qtdeDentesART = data.dental?.qtde_dentes_art ?? 0;
			dentalData.hasEscovacao = data.dental?.has_escovacao ?? false;
			dentalData.observacoes = data.dental?.observacoes ?? '';

			console.log('✅ Loaded visual acuity:', visualAcuityData);

			// Reset ausente checkbox
			alunoAusente = false;
			// PRESERVE active tab - do NOT reset to 'antropometria'
		} else {
			console.log('🆕 First load for student', currentStudentId);

			// First load - initialize data
			anthropometryData.pesoKg = data.anthropometry?.peso_kg ?? null;
			anthropometryData.alturaCm = data.anthropometry?.altura_cm ?? null;
			anthropometryData.observacoes = data.anthropometry?.observacoes ?? '';

			visualAcuityData.olhoDireito = data.visualAcuity?.olho_direito ?? null;
			visualAcuityData.olhoEsquerdo = data.visualAcuity?.olho_esquerdo ?? null;
			visualAcuityData.olhoDireitoReteste = data.visualAcuity?.olho_direito_reteste ?? null;
			visualAcuityData.olhoEsquerdoReteste = data.visualAcuity?.olho_esquerdo_reteste ?? null;
			visualAcuityData.observacoes = data.visualAcuity?.observacoes ?? '';

			dentalData.risco = data.dental?.risco ?? null;
			dentalData.complemento = data.dental?.complemento ?? null;
			dentalData.classificacaoCompleta = data.dental?.classificacao_completa ?? null;
			dentalData.receberATF = data.dental?.recebeu_atf ?? false;
			dentalData.precisaART = data.dental?.precisa_art ?? false;
			dentalData.qtdeDentesART = data.dental?.qtde_dentes_art ?? 0;
			dentalData.hasEscovacao = data.dental?.has_escovacao ?? false;
			dentalData.observacoes = data.dental?.observacoes ?? '';

			console.log('✅ Loaded visual acuity (first):', visualAcuityData);
		}

		previousStudentId = currentStudentId;
	});

	// Auto-save to local storage with debouncing
	let saveTimeout: ReturnType<typeof setTimeout> | null = null;
	$effect(() => {
		// Only auto-save after initialization
		if (!isInitialized) return;

		// Track all form data changes
		const _ = {
			alunoAusente,
			anthropometry: anthropometryData,
			visualAcuity: visualAcuityData,
			dental: dentalData
		};

		// Debounce the save
		if (saveTimeout) clearTimeout(saveTimeout);
		saveTimeout = setTimeout(async () => {
			await saveToLocalStorage();
		}, 1000); // 1 second debounce
	});

	// Save current form data to local storage
	async function saveToLocalStorage() {
		const localData: LocalEvaluationData = {
			alunoId: data.student.id,
			timestamp: Date.now(),
			syncStatus: 'pending',
			lastSyncAttempt: null,
			studentName: data.student.cliente,
			escolaId: data.enrollment.escola_id,
			turmaName: data.enrollment.turma,
			periodo: data.enrollment.periodo,
			alunoAusente,
			anthropometry: anthropometryData.pesoKg || anthropometryData.alturaCm
				? {
						peso_kg: anthropometryData.pesoKg,
						altura_cm: anthropometryData.alturaCm,
						classificacao_cdc: anthropometryData.observacoes || null
					}
				: null,
			visualAcuity: visualAcuityData.olhoDireito || visualAcuityData.olhoEsquerdo
				? {
						olho_direito: visualAcuityData.olhoDireito,
						olho_esquerdo: visualAcuityData.olhoEsquerdo,
						reteste: visualAcuityData.olhoDireitoReteste
					}
				: null,
			dental: dentalData.risco
				? {
						risco: dentalData.risco,
						complemento: dentalData.complemento,
						classificacao_completa: dentalData.classificacaoCompleta,
						recebeu_atf: dentalData.receberATF,
						precisa_art: dentalData.precisaART,
						qtde_dentes_art: dentalData.qtdeDentesART,
						has_escovacao: dentalData.hasEscovacao,
						observacoes: dentalData.observacoes
					}
				: null
		};

		const success = await localEvaluationStore.saveEvaluation(localData);

		if (success) {
			console.log('💾 Auto-saved to local storage');
		}
	}

	// Save handler - saves data from ALL tabs with offline fallback
	async function handleSave() {
		isSaving = true;

		console.log('🚀 Starting save process...', { anthropometryData, visualAcuityData, dentalData });

		const formData = new FormData();

		// Add anthropometry data if present
		if (anthropometryData.pesoKg || anthropometryData.alturaCm) {
			formData.append('peso_kg', String(anthropometryData.pesoKg ?? ''));
			formData.append('altura_cm', String(anthropometryData.alturaCm ?? ''));
			formData.append('observacoes_antropometria', anthropometryData.observacoes ?? '');
			console.log('📤 Sending anthropometry:', {
				peso: anthropometryData.pesoKg,
				altura: anthropometryData.alturaCm
			});
		}

		// Add visual acuity data if present
		if (
			visualAcuityData.olhoDireito ||
			visualAcuityData.olhoEsquerdo ||
			visualAcuityData.olhoDireitoReteste ||
			visualAcuityData.olhoEsquerdoReteste
		) {
			if (visualAcuityData.olhoDireito !== null)
				formData.append('olho_direito', String(visualAcuityData.olhoDireito));
			if (visualAcuityData.olhoEsquerdo !== null)
				formData.append('olho_esquerdo', String(visualAcuityData.olhoEsquerdo));
			if (visualAcuityData.olhoDireitoReteste !== null)
				formData.append('olho_direito_reteste', String(visualAcuityData.olhoDireitoReteste));
			if (visualAcuityData.olhoEsquerdoReteste !== null)
				formData.append('olho_esquerdo_reteste', String(visualAcuityData.olhoEsquerdoReteste));
			formData.append('observacoes_visual', visualAcuityData.observacoes ?? '');
		}

		// Add dental evaluation data if present
		if (dentalData.risco) {
			formData.append('risco', dentalData.risco);
			if (dentalData.complemento) formData.append('complemento', dentalData.complemento);
			if (dentalData.classificacaoCompleta)
				formData.append('classificacao_completa', dentalData.classificacaoCompleta);
			formData.append('recebeu_atf', String(dentalData.receberATF));
			formData.append('precisa_art', String(dentalData.precisaART));
			formData.append('qtde_dentes_art', String(dentalData.qtdeDentesART));
			formData.append('has_escovacao', String(dentalData.hasEscovacao));
			formData.append('observacoes_dental', dentalData.observacoes ?? '');
		}

		try {
			// Attempt server sync first
			const response = await fetch('?/saveEvaluation', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (result.type === 'success') {
				// Server sync successful - clear local storage
				await localEvaluationStore.clearEvaluation(data.student.id);

				toast.success('Avaliação sincronizada com o servidor!', {
					description: 'Dados salvos com sucesso',
					duration: 3000
				});

				// Navigation will happen via form action redirect
			} else {
				// Server returned error - keep data in local storage
				await localEvaluationStore.updateSyncStatus(data.student.id, 'failed');

				const errorMsg = result.data?.error || 'Erro ao salvar dados';
				toast.error('Erro ao salvar no servidor', {
					description: `${errorMsg}. Dados mantidos localmente.`,
					duration: 5000
				});
			}
		} catch (error) {
			// Network error - save to local storage as fallback
			console.error('Network error during save:', error);

			await saveToLocalStorage();
			await localEvaluationStore.updateSyncStatus(data.student.id, 'failed');

			toast.error('Sem conexão com o servidor', {
				description: 'Dados salvos localmente e serão sincronizados quando possível.',
				duration: 5000,
				action: {
					label: 'Tentar novamente',
					onClick: () => handleSave()
				}
			});
		} finally {
			isSaving = false;
		}
	}
</script>

<div class="flex flex-col h-screen bg-gray-50">
	<!-- Breadcrumb Navigation -->
	<div class="bg-white border-b border-gray-200 p-3">
		<Breadcrumb.Root>
			<Breadcrumb.List>
				<Breadcrumb.Item>
					<Breadcrumb.Link href="/dashboard">Dashboard</Breadcrumb.Link>
				</Breadcrumb.Item>
				<Breadcrumb.Separator />
				<Breadcrumb.Item>
					<Breadcrumb.Link href={`/escolas/${data.enrollment.escola_id}`}>
						{data.enrollment.escola_nome}
					</Breadcrumb.Link>
				</Breadcrumb.Item>
				<Breadcrumb.Separator />
				<Breadcrumb.Item>
					<Breadcrumb.Link
						href={`/escolas/${data.enrollment.escola_id}/${encodeURIComponent(data.enrollment.periodo)}`}
					>
						{formatPeriod(data.enrollment.periodo)}
					</Breadcrumb.Link>
				</Breadcrumb.Item>
				<Breadcrumb.Separator />
				<Breadcrumb.Item>
					<Breadcrumb.Page>{data.enrollment.turma}</Breadcrumb.Page>
				</Breadcrumb.Item>
			</Breadcrumb.List>
		</Breadcrumb.Root>
	</div>

	<!-- Fixed Header -->
	<EvaluationHeader
		studentName={data.student.cliente}
		dateOfBirth={data.student.data_nasc!}
		{age}
		bind:alunoAusente
	/>

	<!-- Scrollable Content Area with Tabs -->
	<div class="flex-1 overflow-y-auto">
		<div class="p-4">
			<Tabs.Root bind:value={activeTab}>
				<Tabs.List>
					<Tabs.Trigger value="antropometria">Antropometria</Tabs.Trigger>
					<Tabs.Trigger value="visual">Visual</Tabs.Trigger>
					<Tabs.Trigger value="odonto">Odonto</Tabs.Trigger>
				</Tabs.List>

				<Tabs.Content value="antropometria">
					<div class="bg-white rounded-lg border border-gray-200">
						<AnthropometryForm
							studentAge={age}
							studentSex={data.student.sexo ?? 'M'}
							bind:pesoKg={anthropometryData.pesoKg}
							bind:alturaCm={anthropometryData.alturaCm}
							bind:observacoes={anthropometryData.observacoes}
							disabled={alunoAusente}
						/>
					</div>
				</Tabs.Content>

				<Tabs.Content value="visual">
					<div class="bg-white rounded-lg border border-gray-200">
						<VisualAcuityForm
							bind:olhoDireito={visualAcuityData.olhoDireito}
							bind:olhoEsquerdo={visualAcuityData.olhoEsquerdo}
							bind:olhoDireitoReteste={visualAcuityData.olhoDireitoReteste}
							bind:olhoEsquerdoReteste={visualAcuityData.olhoEsquerdoReteste}
							bind:observacoes={visualAcuityData.observacoes}
							disabled={alunoAusente}
						/>
					</div>
				</Tabs.Content>

				<Tabs.Content value="odonto">
					<div class="bg-white rounded-lg border border-gray-200">
						<DentalEvaluationForm
							bind:risco={dentalData.risco}
							bind:complemento={dentalData.complemento}
							bind:classificacaoCompleta={dentalData.classificacaoCompleta}
							bind:receberATF={dentalData.receberATF}
							bind:precisaART={dentalData.precisaART}
							bind:qtdeDentesART={dentalData.qtdeDentesART}
							bind:hasEscovacao={dentalData.hasEscovacao}
							bind:observacoes={dentalData.observacoes}
							disabled={alunoAusente}
						/>
					</div>
				</Tabs.Content>
			</Tabs.Root>
		</div>
	</div>

	<!-- Fixed Footer -->
	<EvaluationFooter
		previousStudentId={data.navigation.previousStudentId}
		nextStudentId={data.navigation.nextStudentId}
		currentPosition={data.navigation.currentPosition}
		totalStudents={data.navigation.totalStudents}
		onsave={handleSave}
	/>
</div>
