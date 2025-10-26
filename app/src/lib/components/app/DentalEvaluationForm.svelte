<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Toggle } from '$lib/components/ui/toggle';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Separator } from '$lib/components/ui/separator';

	// Props
	let {
		risco = $bindable(null),
		complemento = $bindable(null),
		classificacaoCompleta = $bindable(null),
		receberATF = $bindable(false),
		precisaART = $bindable(false),
		qtdeDentesART = $bindable(0),
		hasEscovacao = $bindable(false),
		observacoes = $bindable(''),
		disabled = false
	}: {
		risco?: string | null;
		complemento?: string | null;
		classificacaoCompleta?: string | null;
		receberATF?: boolean;
		precisaART?: boolean;
		qtdeDentesART?: number;
		hasEscovacao?: boolean;
		observacoes?: string;
		disabled?: boolean;
	} = $props();

	// Reactive classification computation
	$effect(() => {
		if (risco) {
			classificacaoCompleta = risco + (complemento || '');
		} else {
			classificacaoCompleta = null;
		}
	});

	const riscoOptions = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
	const complementoOptions = ['+', '-'];
</script>

<div class="flex flex-col gap-6 p-4">
	<!-- Risco Classification Section -->
	<div class="flex flex-col gap-3">
		<Label class="text-base font-semibold">Risco</Label>
		<div class="grid grid-cols-4 gap-3 sm:grid-cols-7">
			{#each riscoOptions as option}
				<Button
					variant={risco === option ? 'default' : 'outline'}
					size="lg"
					class="h-14 w-full text-lg font-bold"
					onclick={() => (risco = option)}
					{disabled}
				>
					{option}
				</Button>
			{/each}
		</div>
	</div>

	<!-- Complemento Section -->
	<div class="flex flex-col gap-3">
		<Label class="text-base font-semibold">Complemento (Sinal)</Label>
		<div class="grid grid-cols-2 gap-3">
			{#each complementoOptions as option}
				<Toggle
					pressed={complemento === option}
					onPressedChange={(pressed: boolean) => {
						if (pressed) {
							complemento = option;
						} else {
							complemento = null;
						}
					}}
					size="lg"
					class="h-14 text-xl font-bold data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
					{disabled}
				>
					{option}
				</Toggle>
			{/each}
		</div>
		<Button
			variant="ghost"
			size="sm"
			onclick={() => (complemento = null)}
			{disabled}
			class="text-sm"
		>
			Limpar Complemento
		</Button>
	</div>

	<!-- Classification Display -->
	{#if classificacaoCompleta}
		<div class="rounded-lg border-2 border-primary bg-primary/10 p-4 text-center">
			<p class="text-sm font-medium text-muted-foreground">Classificação Completa</p>
			<p class="text-3xl font-bold text-primary">{classificacaoCompleta}</p>
		</div>
	{/if}

	<Separator />

	<!-- Checkboxes Section -->
	<div class="flex flex-col gap-4">
		<!-- ATF Checkbox -->
		<div class="flex items-center gap-3">
			<Checkbox id="atf-checkbox" bind:checked={receberATF} {disabled} />
			<Label for="atf-checkbox" class="text-base">ATF Realizado</Label>
		</div>

		<!-- ART Checkbox with Conditional Input -->
		<div class="flex flex-col gap-3">
			<div class="flex items-center gap-3">
				<Checkbox id="art-checkbox" bind:checked={precisaART} {disabled} />
				<Label for="art-checkbox" class="text-base">Necessita ART</Label>
			</div>

			{#if precisaART}
				<div class="ml-8 flex flex-col gap-2">
					<Label for="qtde-dentes" class="text-sm">Quantidade de Dentes</Label>
					<Input
						id="qtde-dentes"
						type="number"
						min="0"
						max="32"
						bind:value={qtdeDentesART}
						{disabled}
						placeholder="Ex: 2"
						class="w-32"
					/>
				</div>
			{/if}
		</div>

		<!-- Escovação Orientada Checkbox -->
		<div class="flex items-center gap-3">
			<Checkbox id="escovacao-checkbox" bind:checked={hasEscovacao} {disabled} />
			<Label for="escovacao-checkbox" class="text-base">Escovação Orientada Realizada</Label>
		</div>
	</div>

	<!-- Observações -->
	<div class="flex flex-col gap-2">
		<Label for="observacoes">Observações</Label>
		<Textarea
			id="observacoes"
			bind:value={observacoes}
			{disabled}
			placeholder="Observações adicionais (opcional)"
			rows={3}
		/>
	</div>
</div>
