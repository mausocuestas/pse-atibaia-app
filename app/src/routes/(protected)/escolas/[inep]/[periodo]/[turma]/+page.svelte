<script lang="ts">
	import type { PageData } from './$types';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { formatPeriod, formatDateOfBirthWithAge } from '$lib/utils/periods';

	let { data }: { data: PageData } = $props();

	const escola = data.escola;
	const periodo = data.periodo;
	const turma = data.turma;
	const students = data.students || [];
</script>

<div class="flex flex-1 flex-col gap-6 p-4 md:p-6">
	<!-- Breadcrumb Navigation -->
	<Breadcrumb.Root>
		<Breadcrumb.List>
			<Breadcrumb.Item>
				<Breadcrumb.Link href="/dashboard">Dashboard</Breadcrumb.Link>
			</Breadcrumb.Item>
			<Breadcrumb.Separator />
			<Breadcrumb.Item>
				<Breadcrumb.Link href="/escolas/{escola?.inep}">{escola?.escola || 'Escola'}</Breadcrumb.Link>
			</Breadcrumb.Item>
			<Breadcrumb.Separator />
			<Breadcrumb.Item>
				<Breadcrumb.Link href="/escolas/{escola?.inep}/{encodeURIComponent(periodo || '')}">{periodo ? formatPeriod(periodo) : 'Período'}</Breadcrumb.Link>
			</Breadcrumb.Item>
			<Breadcrumb.Separator />
			<Breadcrumb.Item>
				<Breadcrumb.Page>{turma || 'Turma'}</Breadcrumb.Page>
			</Breadcrumb.Item>
		</Breadcrumb.List>
	</Breadcrumb.Root>

	<!-- Class Header -->
	<div>
		<h1 class="text-2xl font-bold text-gray-900 mb-1">
			Turma {turma || ''}
		</h1>
		<p class="text-gray-600">
			{escola?.escola || 'Escola'} - {periodo ? formatPeriod(periodo) : 'Período'}
		</p>
	</div>

	<!-- Students Section -->
	<div class="space-y-4">
		<h2 class="text-xl font-semibold text-gray-900">
			Alunos ({students.length})
		</h2>

		{#if students.length === 0}
			<div class="text-center py-12 bg-white rounded-lg shadow">
				<p class="text-gray-500">Nenhum aluno matriculado nesta turma.</p>
			</div>
		{:else}
			<div class="flex flex-col gap-2">
				{#each students as student (student.aluno_id)}
					<a
						href="/avaliar/{student.aluno_id}"
						class="p-4 border rounded-lg hover:bg-gray-50 transition-colors bg-white block"
					>
						<div class="flex flex-col gap-2">
							<div class="font-medium text-gray-900">{student.nome}</div>
							<div class="text-sm text-gray-600">
								{formatDateOfBirthWithAge(student.data_nasc, student.idade)}
							</div>
							{#if student.has_visual_eval || student.has_anthropometric_eval || student.has_dental_eval}
								<div class="flex flex-wrap gap-2 mt-1">
									{#if student.has_visual_eval}
										<Badge variant="secondary">Visual</Badge>
									{/if}
									{#if student.has_anthropometric_eval}
										<Badge variant="secondary">Antropométrica</Badge>
									{/if}
									{#if student.has_dental_eval}
										<Badge variant="secondary">Odontológica</Badge>
									{/if}
								</div>
							{/if}
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</div>
