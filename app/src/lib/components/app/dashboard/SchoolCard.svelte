<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Progress } from '$lib/components/ui/progress/index.js';

	interface Props {
		school: {
			inep: number;
			escola: string;
			bairro: string | null;
			tipo: string | null;
			total_alunos: number;
			alunos_avaliados: number;
		};
	}

	let { school }: Props = $props();

	// Calculate evaluation progress percentage
	const progressPercentage = $derived(
		school.total_alunos > 0
			? Math.round((school.alunos_avaliados / school.total_alunos) * 100)
			: 0
	);
</script>

<a
	href="/escolas/{school.inep}"
	class="block transition-shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
>
	<Card.Root class="h-full">
		<Card.Header>
			<Card.Title class="text-lg">{school.escola}</Card.Title>
			<Card.Description>
				{school.bairro || 'Bairro não informado'}
			</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-4">
			<div class="text-sm text-muted-foreground">
				<p class="font-semibold text-foreground text-base">{school.total_alunos} alunos</p>
			</div>
			{#if school.total_alunos > 0}
				<div class="space-y-2">
					<div class="flex justify-between text-sm">
						<span>{school.alunos_avaliados} alunos avaliados</span>
						<span class="font-medium">{progressPercentage}%</span>
					</div>
					<Progress value={progressPercentage} max={100} class="w-full" />
				</div>
			{:else}
				<div class="text-sm text-muted-foreground">
					<p>Nenhum aluno matriculado</p>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</a>
