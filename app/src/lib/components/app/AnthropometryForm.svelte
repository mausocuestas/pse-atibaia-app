<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Badge } from '$lib/components/ui/badge';
	import {
		calculateBMI,
		calculateCDCClassification,
		getClassificationColorVariant,
		type CDCClassification
	} from '$lib/utils/cdc-classification';

	// Props
	let {
		studentAge,
		studentSex,
		pesoKg = $bindable(null),
		alturaCm = $bindable(null),
		observacoes = $bindable(''),
		disabled = false
	}: {
		studentAge: number;
		studentSex: string;
		pesoKg?: number | null;
		alturaCm?: number | null;
		observacoes?: string;
		disabled?: boolean;
	} = $props();

	// Reactive calculations using Svelte 5 $derived
	let bmi = $derived(pesoKg && alturaCm && pesoKg > 0 && alturaCm > 0 ? calculateBMI(pesoKg, alturaCm) : null);

	let cdcClassification: CDCClassification | null = $derived(
		bmi && studentAge && studentSex ? calculateCDCClassification(bmi, studentAge, studentSex) : null
	);

	// Badge color based on classification
	let classificationVariant = $derived(
		cdcClassification ? getClassificationColorVariant(cdcClassification) : 'outline'
	);
</script>

<div class="flex flex-col gap-4 p-4">
	<!-- Weight and Height Inputs -->
	<div class="grid grid-cols-2 gap-4">
		<!-- Peso Input -->
		<div class="flex flex-col gap-2">
			<Label for="peso">Peso (kg)</Label>
			<Input
				id="peso"
				type="number"
				step="0.1"
				min="0"
				max="300"
				bind:value={pesoKg}
				{disabled}
				placeholder="Ex: 30.5"
				class="text-base"
			/>
		</div>

		<!-- Altura Input -->
		<div class="flex flex-col gap-2">
			<Label for="altura">Altura (cm)</Label>
			<Input
				id="altura"
				type="number"
				step="0.1"
				min="0"
				max="250"
				bind:value={alturaCm}
				{disabled}
				placeholder="Ex: 140"
				class="text-base"
			/>
		</div>
	</div>

	<!-- BMI Display -->
	{#if bmi}
		<div class="flex flex-col gap-1 rounded-md bg-muted p-3">
			<span class="text-sm text-muted-foreground">IMC Calculado</span>
			<span class="text-2xl font-bold">{bmi.toFixed(2)}</span>
		</div>
	{/if}

	<!-- CDC Classification Display -->
	{#if cdcClassification}
		<div class="flex flex-col gap-2">
			<Label>Classificação CDC</Label>
			<Badge variant={classificationVariant} class="w-fit px-3 py-1 text-sm">
				{cdcClassification}
			</Badge>
		</div>
	{/if}

	<!-- Observações -->
	<div class="flex flex-col gap-2">
		<Label for="observacoes">Observações</Label>
		<Textarea
			id="observacoes"
			bind:value={observacoes}
			{disabled}
			placeholder="Observações adicionais (opcional)"
			rows={3}
			class="text-base"
		/>
	</div>
</div>
