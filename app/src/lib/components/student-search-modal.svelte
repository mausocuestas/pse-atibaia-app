<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
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

	// Registration form state
	let showRegistrationForm = $state(false);
	let isCreatingStudent = $state(false);
	let newStudent = $state({
		nomeCompleto: '',
		dataNascimento: '',
		sexo: '',
		cpf: '',
		cns: ''
	});

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
		showRegistrationForm = false;
		isCreatingStudent = false;
		newStudent = {
			nomeCompleto: '',
			dataNascimento: '',
			sexo: '',
			cpf: '',
			cns: ''
		};
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

	// Show registration form
	function showRegistration() {
		showRegistrationForm = true;
	}

	// Back to search from registration form
	function backToSearch() {
		showRegistrationForm = false;
		newStudent = {
			nomeCompleto: '',
			dataNascimento: '',
			sexo: '',
			cpf: '',
			cns: ''
		};
	}

	// Format CPF input (auto-format as user types)
	function formatCPFInput(event: Event) {
		const input = event.target as HTMLInputElement;
		let value = input.value.replace(/\D/g, ''); // Remove non-digits

		if (value.length > 11) {
			value = value.slice(0, 11);
		}

		// Format as XXX.XXX.XXX-XX
		if (value.length > 9) {
			value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
		} else if (value.length > 6) {
			value = value.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
		} else if (value.length > 3) {
			value = value.replace(/(\d{3})(\d{1,3})/, '$1.$2');
		}

		input.value = value;
		newStudent.cpf = value;
	}

	// Create new student and enroll
	async function createStudent() {
		// Validate required fields
		if (!newStudent.nomeCompleto || !newStudent.dataNascimento || !newStudent.sexo) {
			toast.error('Por favor, preencha todos os campos obrigatórios');
			return;
		}

		isCreatingStudent = true;

		try {
			const response = await fetch('/api/students/create', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					cliente: newStudent.nomeCompleto,
					data_nasc: newStudent.dataNascimento,
					sexo: newStudent.sexo,
					cpf: newStudent.cpf.replace(/\D/g, ''), // Send only digits
					cns: newStudent.cns,
					escolaId,
					turma,
					periodo,
					anoLetivo
				})
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Erro ao cadastrar aluno');
			}

			const result = await response.json();
			toast.success('Aluno cadastrado e matriculado com sucesso!');

			// Dispatch event to parent to refresh student list
			dispatch('student-enrolled', { student: result.student });

			// Close modal
			handleClose();
		} catch (error) {
			console.error('Student creation error:', error);
			toast.error(error instanceof Error ? error.message : 'Erro ao cadastrar aluno');
		} finally {
			isCreatingStudent = false;
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
		<Dialog.Content class="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg md:w-full">
			<Dialog.Header>
				<Dialog.Title>
					{showRegistrationForm ? 'Cadastrar Novo Aluno' : 'Buscar Aluno'}
				</Dialog.Title>
				<Dialog.Description>
					{showRegistrationForm
						? 'Preencha os dados do novo aluno para cadastrá-lo e matriculá-lo nesta turma.'
						: 'Busque um aluno por nome, data de nascimento ou CPF para matricular nesta turma.'}
				</Dialog.Description>
			</Dialog.Header>

			<div class="space-y-4">
				{#if !showRegistrationForm}
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

						<Button class="w-full" onclick={searchStudents} disabled={isSearching}>
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
									class="w-full border rounded-lg p-3 text-left cursor-pointer transition-colors hover:bg-gray-50 {selectedStudent?.id ===
									student.id
										? 'border-blue-500 bg-blue-50'
										: 'border-gray-200'}"
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
					{:else if searchCriteria.nome || searchCriteria.dataNascimento || searchCriteria.cpf}
						<!-- No results found - show "Register New Student" button -->
						<div class="text-center py-4 space-y-3">
							<p class="text-sm text-gray-600">Nenhum aluno encontrado com os critérios informados.</p>
							<Button variant="default" onclick={showRegistration} class="w-full">
								Cadastrar Novo Aluno
							</Button>
						</div>
					{/if}
				{:else}
					<!-- Registration Form -->
					<form onsubmit={(e) => { e.preventDefault(); createStudent(); }} class="space-y-4">
						<div>
							<Label for="nomeCompleto">Nome Completo *</Label>
							<Input
								id="nomeCompleto"
								bind:value={newStudent.nomeCompleto}
								placeholder="Nome completo do aluno"
								required
								class="mt-1"
							/>
						</div>

						<div>
							<Label for="dataNascimentoNew">Data de Nascimento *</Label>
							<Input
								id="dataNascimentoNew"
								type="date"
								bind:value={newStudent.dataNascimento}
								required
								class="mt-1"
							/>
						</div>

						<div>
							<Label for="sexo">Sexo *</Label>
							<Select.Root type="single" bind:value={newStudent.sexo}>
								<Select.Trigger id="sexo" class="w-full mt-1">
									{newStudent.sexo === 'M' ? 'Masculino' : newStudent.sexo === 'F' ? 'Feminino' : 'Selecione o sexo'}
								</Select.Trigger>
								<Select.Content>
									<Select.Item value="M">Masculino</Select.Item>
									<Select.Item value="F">Feminino</Select.Item>
								</Select.Content>
							</Select.Root>
						</div>

						<div>
							<Label for="cpfNew">CPF (opcional)</Label>
							<Input
								id="cpfNew"
								bind:value={newStudent.cpf}
								oninput={formatCPFInput}
								placeholder="000.000.000-00"
								maxlength={14}
								class="mt-1"
							/>
							<p class="text-xs text-gray-500 mt-1">Apenas números, será formatado automaticamente</p>
						</div>

						<div>
							<Label for="cnsNew">CNS - Cartão Nacional de Saúde (opcional)</Label>
							<Input
								id="cnsNew"
								bind:value={newStudent.cns}
								placeholder="000 0000 0000 0000"
								maxlength={15}
								class="mt-1"
							/>
						</div>

						<div class="flex gap-2 pt-2">
							<Button
								type="button"
								variant="outline"
								onclick={backToSearch}
								disabled={isCreatingStudent}
								class="flex-1"
							>
								Voltar
							</Button>
							<Button type="submit" disabled={isCreatingStudent} class="flex-1">
								{isCreatingStudent ? 'Cadastrando...' : 'Cadastrar e Matricular'}
							</Button>
						</div>
					</form>
				{/if}
			</div>

			{#if !showRegistrationForm}
				<Dialog.Footer>
					<Button variant="outline" onclick={handleClose} disabled={isEnrolling}>
						Cancelar
					</Button>
					<Button onclick={enrollStudent} disabled={!selectedStudent || isEnrolling}>
						{isEnrolling ? 'Matriculando...' : 'Matricular'}
					</Button>
				</Dialog.Footer>
			{/if}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>