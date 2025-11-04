<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { toast } from 'svelte-sonner';

	interface StudentSearchResult {
		id: number;
		nomeCompleto: string;
		dataNascimento: string;
		cpf?: string;
		cns?: string;
		existingEnrollments?: Array<{
			escolaId: number;
			escolaNome: string;
			turma: string;
			periodo: string;
			anoLetivo: number;
		}>;
	}

	let {
		open = $bindable(),
		escolaId,
		turma,
		periodo,
		anoLetivo
	}: {
		open: boolean;
		escolaId: number;
		turma: string;
		periodo: string;
		anoLetivo: number;
	} = $props();

	const dispatch = createEventDispatcher();

	// Search form state
	let searchCriteria = $state({
		nome: '',
		dataNascimento: '',
		cpf: ''
	});

	let searchResults = $state<StudentSearchResult[]>([]);
	let isSearching = $state(false);
	let selectedStudent = $state<StudentSearchResult | null>(null);
	let isEnrolling = $state(false);

	// Close modal
	function handleClose() {
		dispatch('close');
		resetForm();
	}

	// Reset form state
	function resetForm() {
		searchCriteria = {
			nome: '',
			dataNascimento: '',
			cpf: ''
		};
		searchResults = [];
		selectedStudent = null;
		isSearching = false;
		isEnrolling = false;
	}

	// Search for students
	async function searchStudents() {
		if (!searchCriteria.nome && !searchCriteria.dataNascimento && !searchCriteria.cpf) {
			toast.error('Por favor, preencha pelo menos um campo para buscar');
			return;
		}

		isSearching = true;
		searchResults = [];

		try {
			const response = await fetch('/api/students/search', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(searchCriteria)
			});

			if (!response.ok) {
				throw new Error('Erro ao buscar alunos');
			}

			const results = await response.json();
			searchResults = results;

			if (results.length === 0) {
				toast.info('Nenhum aluno encontrado com os critérios informados');
			}
		} catch (error) {
			console.error('Search error:', error);
			toast.error('Erro ao buscar alunos. Tente novamente.');
		} finally {
			isSearching = false;
		}
	}

	// Select a student
	function selectStudent(student: StudentSearchResult) {
		selectedStudent = student;
	}

	// Enroll selected student
	async function enrollStudent() {
		if (!selectedStudent) {
			toast.error('Por favor, selecione um aluno');
			return;
		}

		isEnrolling = true;

		try {
			const response = await fetch('/api/students/enroll', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					studentId: selectedStudent.id,
					escolaId,
					turma,
					periodo,
					anoLetivo
				})
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Erro ao matricular aluno');
			}

			const result = await response.json();
			toast.success('Aluno matriculado com sucesso!');

			// Dispatch event to parent to refresh student list
			dispatch('student-enrolled', { student: result.student });

			// Close modal
			handleClose();
		} catch (error) {
			console.error('Enrollment error:', error);
			toast.error(error instanceof Error ? error.message : 'Erro ao matricular aluno');
		} finally {
			isEnrolling = false;
		}
	}

	// Format date for display
	function formatDate(dateString: string) {
		if (!dateString) return '';
		const date = new Date(dateString);
		return date.toLocaleDateString('pt-BR');
	}

	// Format CPF for display
	function formatCPF(cpf?: string) {
		if (!cpf) return '';
		// Simple CPF formatting: XXX.XXX.XXX-XX
		return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
		<Dialog.Content class="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg md:w-full">
			<Dialog.Header>
				<Dialog.Title>Buscar Aluno</Dialog.Title>
				<Dialog.Description>
					Busque um aluno por nome, data de nascimento ou CPF para matricular nesta turma.
				</Dialog.Description>
			</Dialog.Header>

			<div class="space-y-4">
				<!-- Search Form -->
				<div class="space-y-3">
					<div>
						<Label for="nome">Nome</Label>
						<Input
							id="nome"
							bind:value={searchCriteria.nome}
							placeholder="Nome do aluno"
							onkeypress={(e) => e.key === 'Enter' && searchStudents()}
						/>
					</div>

					<div>
						<Label for="dataNascimento">Data de Nascimento</Label>
						<Input
							id="dataNascimento"
							type="date"
							bind:value={searchCriteria.dataNascimento}
						/>
					</div>

					<div>
						<Label for="cpf">CPF</Label>
						<Input
							id="cpf"
							bind:value={searchCriteria.cpf}
							placeholder="000.000.000-00"
							onkeypress={(e) => e.key === 'Enter' && searchStudents()}
						/>
					</div>

					<Button
						class="w-full"
						onclick={searchStudents}
						disabled={isSearching}
					>
						{isSearching ? 'Buscando...' : 'Buscar'}
					</Button>
				</div>

				<!-- Search Results -->
				{#if searchResults.length > 0}
					<div class="space-y-2 max-h-60 overflow-y-auto">
						<h4 class="text-sm font-medium text-gray-700">
							{searchResults.length} aluno(s) encontrado(s)
						</h4>

						{#each searchResults as student (student.id)}
							<button
								type="button"
								class="w-full border rounded-lg p-3 text-left cursor-pointer transition-colors hover:bg-gray-50 {selectedStudent?.id === student.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}"
								onclick={() => selectStudent(student)}
								onkeypress={(e) => e.key === 'Enter' && selectStudent(student)}
							>
								<div class="flex flex-col gap-1">
									<div class="font-medium text-gray-900">{student.nomeCompleto}</div>
									<div class="text-sm text-gray-600">
										Data de Nascimento: {formatDate(student.dataNascimento)}
									</div>
									{#if student.cpf}
										<div class="text-sm text-gray-600">
											CPF: {formatCPF(student.cpf)}
										</div>
									{/if}
									{#if student.cns}
										<div class="text-sm text-gray-600">
											CNS: {student.cns}
										</div>
									{/if}
								</div>
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<Dialog.Footer>
				<Button
					variant="outline"
					onclick={handleClose}
					disabled={isEnrolling}
				>
					Cancelar
				</Button>
				<Button
					onclick={enrollStudent}
					disabled={!selectedStudent || isEnrolling}
				>
					{isEnrolling ? 'Matriculando...' : 'Matricular'}
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>