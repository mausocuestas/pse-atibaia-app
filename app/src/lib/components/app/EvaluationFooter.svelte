<script lang="ts">
	import { Button } from '$lib/components/ui/button';

	let {
		previousStudentId,
		nextStudentId,
		currentPosition,
		totalStudents,
		onsave
	}: {
		previousStudentId: number | null;
		nextStudentId: number | null;
		currentPosition: number;
		totalStudents: number;
		onsave?: () => void;
	} = $props();

	function handleSaveAndNext() {
		if (onsave) {
			onsave();
		}
	}
</script>

<footer class="bg-white border-t border-gray-200 p-4 sticky bottom-0 z-10 shadow-sm">
	<div class="flex items-center justify-between gap-4">
		<Button
			variant="outline"
			href={previousStudentId ? `/avaliar/${previousStudentId}` : undefined}
			disabled={!previousStudentId}
			class="min-h-[44px] min-w-[100px]"
		>
			&lt; Anterior
		</Button>

		<span class="text-sm text-gray-600 font-medium">
			{currentPosition} / {totalStudents}
		</span>

		{#if nextStudentId}
			<Button
				href={`/avaliar/${nextStudentId}`}
				onclick={handleSaveAndNext}
				class="min-h-[44px] min-w-[140px]"
			>
				Salvar e Próximo &gt;
			</Button>
		{:else}
			<Button onclick={handleSaveAndNext} class="min-h-[44px] min-w-[140px]">
				Salvar e Finalizar
			</Button>
		{/if}
	</div>
</footer>
