<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Separator } from '$lib/components/ui/separator';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { Info } from '@lucide/svelte';

	// Props with $bindable for two-way binding
	let {
		olhoDireito = $bindable(null),
		olhoEsquerdo = $bindable(null),
		olhoDireitoReteste = $bindable(null),
		olhoEsquerdoReteste = $bindable(null),
		observacoes = $bindable(''),
		disabled = false
	}: {
		olhoDireito?: number | null;
		olhoEsquerdo?: number | null;
		olhoDireitoReteste?: number | null;
		olhoEsquerdoReteste?: number | null;
		observacoes?: string;
		disabled?: boolean;
	} = $props();

	// Validation function to clamp values between 0 and 2.0
	function validateAcuityValue(value: number | null): number | null {
		if (value === null || value === undefined || isNaN(value)) return null;
		if (value < 0) return 0;
		if (value > 2.0) return 2.0;
		return Math.round(value * 100) / 100; // Round to 2 decimal places
	}

	// Apply validation on blur for each field
	function handleBlur(field: 'od' | 'oe' | 'od_reteste' | 'oe_reteste') {
		switch (field) {
			case 'od':
				olhoDireito = validateAcuityValue(olhoDireito);
				break;
			case 'oe':
				olhoEsquerdo = validateAcuityValue(olhoEsquerdo);
				break;
			case 'od_reteste':
				olhoDireitoReteste = validateAcuityValue(olhoDireitoReteste);
				break;
			case 'oe_reteste':
				olhoEsquerdoReteste = validateAcuityValue(olhoEsquerdoReteste);
				break;
		}
	}
</script>

<div class="flex flex-col gap-4 p-4">
	<!-- Initial Measurements Section -->
	<div class="flex flex-col gap-3">
		<h3 class="text-sm font-semibold text-gray-700">Medição Inicial</h3>

		<div class="grid grid-cols-2 gap-4">
			<!-- Olho Direito -->
			<div class="flex flex-col gap-2">
				<Label for="olho-direito" class="text-sm">Olho Direito (OD)</Label>
				<Input
					id="olho-direito"
					name="olho_direito"
					type="number"
					step="0.01"
					min="0"
					max="2.0"
					bind:value={olhoDireito}
					onblur={() => handleBlur('od')}
					{disabled}
					placeholder="Ex: 1.0"
					class="text-base"
				/>
			</div>

			<!-- Olho Esquerdo -->
			<div class="flex flex-col gap-2">
				<Label for="olho-esquerdo" class="text-sm">Olho Esquerdo (OE)</Label>
				<Input
					id="olho-esquerdo"
					name="olho_esquerdo"
					type="number"
					step="0.01"
					min="0"
					max="2.0"
					bind:value={olhoEsquerdo}
					onblur={() => handleBlur('oe')}
					{disabled}
					placeholder="Ex: 1.0"
					class="text-base"
				/>
			</div>
		</div>
	</div>

	<Separator />

	<!-- Reteste Section -->
	<div class="flex flex-col gap-3">
		<div class="flex items-start gap-2">
			<h3 class="text-sm font-semibold text-gray-700">Reteste</h3>
			<Tooltip.Provider>
				<Tooltip.Root>
					<Tooltip.Trigger>
						{#snippet child({ props })}
							<button
								{...props}
								type="button"
								class="inline-flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors p-0.5"
								aria-label="Informação sobre reteste"
							>
								<Info class="h-4 w-4 text-gray-500" />
							</button>
						{/snippet}
					</Tooltip.Trigger>
					<Tooltip.Content>
						<p class="max-w-xs text-sm">
							O valor do reteste, se preenchido, tem prioridade sobre as medições individuais dos
							olhos.
						</p>
					</Tooltip.Content>
				</Tooltip.Root>
			</Tooltip.Provider>
		</div>

		<p class="text-xs text-muted-foreground">
			Os valores do reteste prevalecem sobre a medição inicial quando preenchidos.
		</p>

		<div class="grid grid-cols-2 gap-4">
			<!-- Olho Direito Reteste -->
			<div class="flex flex-col gap-2">
				<Label for="olho-direito-reteste" class="text-sm">OD Reteste</Label>
				<Input
					id="olho-direito-reteste"
					name="olho_direito_reteste"
					type="number"
					step="0.01"
					min="0"
					max="2.0"
					bind:value={olhoDireitoReteste}
					onblur={() => handleBlur('od_reteste')}
					{disabled}
					placeholder="Ex: 1.0"
					class="text-base"
				/>
			</div>

			<!-- Olho Esquerdo Reteste -->
			<div class="flex flex-col gap-2">
				<Label for="olho-esquerdo-reteste" class="text-sm">OE Reteste</Label>
				<Input
					id="olho-esquerdo-reteste"
					name="olho_esquerdo_reteste"
					type="number"
					step="0.01"
					min="0"
					max="2.0"
					bind:value={olhoEsquerdoReteste}
					onblur={() => handleBlur('oe_reteste')}
					{disabled}
					placeholder="Ex: 1.0"
					class="text-base"
				/>
			</div>
		</div>
	</div>

	<Separator />

	<!-- Observações -->
	<div class="flex flex-col gap-2">
		<Label for="observacoes-visual" class="text-sm">Observações</Label>
		<Textarea
			id="observacoes-visual"
			name="observacoes_visual"
			bind:value={observacoes}
			{disabled}
			placeholder="Observações adicionais sobre a avaliação visual (opcional)"
			rows={3}
			class="text-base resize-none"
		/>
	</div>
</div>
