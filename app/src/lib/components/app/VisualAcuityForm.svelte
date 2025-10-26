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

	import { toast } from 'svelte-sonner';

	// Validation errors
	let errors = $state<Record<string, string>>({});

	// Validate acuity value (0.0 to 1.0)
	function validateAcuityValue(
		value: number | null,
		fieldName: string,
		fieldId: string
	): boolean {
		if (value === null || value === undefined) {
			delete errors[fieldName];
			return true;
		}

		if (isNaN(value)) {
			errors[fieldName] = 'Valor inválido';
			toast.error('Valor inválido', {
				description: `${fieldName}: Por favor, insira um número válido`
			});
			// Focus back on field
			setTimeout(() => document.getElementById(fieldId)?.focus(), 100);
			return false;
		}

		if (value < 0 || value > 1.0) {
			errors[fieldName] = 'Valor deve estar entre 0.0 e 1.0';
			toast.error('Valor fora do intervalo', {
				description: `${fieldName}: O valor deve estar entre 0.0 e 1.0`
			});
			// Focus back on field
			setTimeout(() => document.getElementById(fieldId)?.focus(), 100);
			return false;
		}

		delete errors[fieldName];
		return true;
	}

	// Apply validation on blur for each field
	function handleBlur(field: 'od' | 'oe' | 'od_reteste' | 'oe_reteste') {
		switch (field) {
			case 'od':
				if (!validateAcuityValue(olhoDireito, 'Olho Direito', 'olho-direito')) {
					olhoDireito = null;
				} else if (olhoDireito !== null) {
					olhoDireito = Math.round(olhoDireito * 100) / 100;
				}
				break;
			case 'oe':
				if (!validateAcuityValue(olhoEsquerdo, 'Olho Esquerdo', 'olho-esquerdo')) {
					olhoEsquerdo = null;
				} else if (olhoEsquerdo !== null) {
					olhoEsquerdo = Math.round(olhoEsquerdo * 100) / 100;
				}
				break;
			case 'od_reteste':
				if (
					!validateAcuityValue(olhoDireitoReteste, 'OD Reteste', 'olho-direito-reteste')
				) {
					olhoDireitoReteste = null;
				} else if (olhoDireitoReteste !== null) {
					olhoDireitoReteste = Math.round(olhoDireitoReteste * 100) / 100;
				}
				break;
			case 'oe_reteste':
				if (
					!validateAcuityValue(olhoEsquerdoReteste, 'OE Reteste', 'olho-esquerdo-reteste')
				) {
					olhoEsquerdoReteste = null;
				} else if (olhoEsquerdoReteste !== null) {
					olhoEsquerdoReteste = Math.round(olhoEsquerdoReteste * 100) / 100;
				}
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
				<div class="flex items-center gap-2">
					<span class="w-3 h-3 rounded-full bg-red-500" title="Olho Direito"></span>
					<Label for="olho-direito" class="text-sm">Olho Direito (OD)</Label>
				</div>
				<Input
					id="olho-direito"
					name="olho_direito"
					type="number"
					step="0.01"
					min="0"
					max="1.0"
					bind:value={olhoDireito}
					onblur={() => handleBlur('od')}
					{disabled}
					placeholder="0.0 a 1.0"
					class={errors['Olho Direito'] ? 'text-base border-red-500' : 'text-base'}
				/>
				{#if errors['Olho Direito']}
					<span class="text-xs text-red-600">{errors['Olho Direito']}</span>
				{/if}
			</div>

			<!-- Olho Esquerdo -->
			<div class="flex flex-col gap-2">
				<div class="flex items-center gap-2">
					<span class="w-3 h-3 rounded-full bg-blue-500" title="Olho Esquerdo"></span>
					<Label for="olho-esquerdo" class="text-sm">Olho Esquerdo (OE)</Label>
				</div>
				<Input
					id="olho-esquerdo"
					name="olho_esquerdo"
					type="number"
					step="0.01"
					min="0"
					max="1.0"
					bind:value={olhoEsquerdo}
					onblur={() => handleBlur('oe')}
					{disabled}
					placeholder="0.0 a 1.0"
					class={errors['Olho Esquerdo'] ? 'text-base border-blue-500' : 'text-base'}
				/>
				{#if errors['Olho Esquerdo']}
					<span class="text-xs text-blue-600">{errors['Olho Esquerdo']}</span>
				{/if}
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
				<div class="flex items-center gap-2">
					<span class="w-3 h-3 rounded-full bg-red-500" title="Olho Direito"></span>
					<Label for="olho-direito-reteste" class="text-sm">OD Reteste</Label>
				</div>
				<Input
					id="olho-direito-reteste"
					name="olho_direito_reteste"
					type="number"
					step="0.01"
					min="0"
					max="1.0"
					bind:value={olhoDireitoReteste}
					onblur={() => handleBlur('od_reteste')}
					{disabled}
					placeholder="0.0 a 1.0"
					class={errors['OD Reteste'] ? 'text-base border-red-500' : 'text-base'}
				/>
				{#if errors['OD Reteste']}
					<span class="text-xs text-red-600">{errors['OD Reteste']}</span>
				{/if}
			</div>

			<!-- Olho Esquerdo Reteste -->
			<div class="flex flex-col gap-2">
				<div class="flex items-center gap-2">
					<span class="w-3 h-3 rounded-full bg-blue-500" title="Olho Esquerdo"></span>
					<Label for="olho-esquerdo-reteste" class="text-sm">OE Reteste</Label>
				</div>
				<Input
					id="olho-esquerdo-reteste"
					name="olho_esquerdo_reteste"
					type="number"
					step="0.01"
					min="0"
					max="1.0"
					bind:value={olhoEsquerdoReteste}
					onblur={() => handleBlur('oe_reteste')}
					{disabled}
					placeholder="0.0 a 1.0"
					class={errors['OE Reteste'] ? 'text-base border-blue-500' : 'text-base'}
				/>
				{#if errors['OE Reteste']}
					<span class="text-xs text-blue-600">{errors['OE Reteste']}</span>
				{/if}
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
