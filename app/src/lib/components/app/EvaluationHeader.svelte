<script lang="ts">
	import { Checkbox } from '$lib/components/ui/checkbox';

	let {
		studentName,
		dateOfBirth,
		age,
		alunoAusente = $bindable(false)
	}: {
		studentName: string;
		dateOfBirth: Date;
		age: number;
		alunoAusente?: boolean;
	} = $props();

	const formattedDOB = $derived(new Date(dateOfBirth).toLocaleDateString('pt-BR'));

	// Visual feedback when student changes
	let isNewStudent = $state(false);
	let previousName = $state<string | null>(null);

	$effect(() => {
		// Track studentName to detect changes
		const currentName = studentName;

		// Only trigger animation if student actually changed (not first load)
		if (previousName !== null && previousName !== currentName) {
			isNewStudent = true;
			const timer = setTimeout(() => {
				isNewStudent = false;
			}, 1500);

			// Cleanup
			return () => clearTimeout(timer);
		}

		previousName = currentName;
	});
</script>

<header class="bg-white border-b border-gray-200 p-4 sticky top-0 z-10 shadow-sm">
	<div class="flex flex-col gap-3">
		<h1
			class="text-xl font-bold text-gray-900 transition-colors duration-500"
			class:bg-green-100={isNewStudent}
			class:px-2={isNewStudent}
			class:py-1={isNewStudent}
			class:rounded={isNewStudent}
		>
			{studentName}
		</h1>
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-4 text-sm text-gray-600">
				<span>Nascimento: {formattedDOB}</span>
				<span>Idade: {age} anos</span>
			</div>
			<div class="flex items-center gap-2">
				<Checkbox id="ausente" bind:checked={alunoAusente} />
				<label
					for="ausente"
					class="text-sm font-medium leading-none cursor-pointer select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
				>
					Aluno Ausente
				</label>
			</div>
		</div>
	</div>
</header>
