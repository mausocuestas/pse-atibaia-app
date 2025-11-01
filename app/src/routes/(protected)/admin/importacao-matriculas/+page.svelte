<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Progress } from '$lib/components/ui/progress';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import Upload from '@lucide/svelte/icons/upload';
	import FileText from '@lucide/svelte/icons/file-text';
	import CheckCircle from '@lucide/svelte/icons/check-circle';
	import AlertCircle from '@lucide/svelte/icons/alert-circle';
	import Info from '@lucide/svelte/icons/info';
	import type { ActionData } from './$types';

	export let form: ActionData;

	$: uploadStatus = form?.status || 'idle';
	$: uploadProgress = form?.progress || 0;
	$: uploadMessage = form?.message || '';
	$: uploadResults = form?.results || null;
	$: uploadErrors = form?.errors || [];

	// File validation on client side
	function validateFile(file: File): string | null {
		// Check file type
		const validTypes = [
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
			'application/vnd.ms-excel' // .xls
		];

		if (!validTypes.includes(file.type)) {
			return 'Tipo de arquivo inválido. Por favor, envie um arquivo .xlsx ou .xls';
		}

		// Check file size (max 10MB)
		const maxSize = 10 * 1024 * 1024; // 10MB in bytes
		if (file.size > maxSize) {
			return 'Arquivo muito grande. O tamanho máximo permitido é 10MB';
		}

		return null;
	}

	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];

		if (file) {
			const validationError = validateFile(file);
			if (validationError) {
				alert(validationError);
				input.value = '';
			}
		}
	}
</script>

<div class="container mx-auto p-6 max-w-4xl">
	<header class="mb-8">
		<h1 class="text-3xl font-bold mb-2">Importação de Matrículas</h1>
		<p class="text-muted-foreground">
			Processamento de planilhas de matrículas para popular o sistema com os dados do novo ano letivo.
		</p>
	</header>

	<!-- Instructions Card -->
	<Card class="mb-6">
		<CardHeader>
			<CardTitle class="flex items-center gap-2">
				<Info class="h-5 w-5" />
				Instruções de Importação
			</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="space-y-4 text-sm">
				<div>
					<h4 class="font-semibold mb-2">Formato do Arquivo:</h4>
					<ul class="list-disc list-inside space-y-1 text-muted-foreground">
						<li>Arquivos .xlsx ou .xls (Excel)</li>
						<li>Tamanho máximo: 10MB</li>
					</ul>
				</div>
				<div>
					<h4 class="font-semibold mb-2">Colunas Esperadas:</h4>
					<ul class="list-disc list-inside space-y-1 text-muted-foreground">
						<li><code>nome_completo</code> ou <code>nome</code> - Nome completo do aluno</li>
						<li><code>data_nascimento</code> ou <code>nascimento</code> - Data de nascimento (DD/MM/YYYY)</li>
						<li><code>sexo</code> - Sexo (M/F ou Masculino/Feminino)</li>
						<li><code>cpf</code> - CPF (opcional)</li>
						<li><code>nis</code> - NIS (opcional)</li>
						<li><code>escola</code> ou <code>nome_escola</code> - Nome da escola</li>
						<li><code>inep</code> - Código INEP da escola (opcional)</li>
						<li><code>turma</code> - Nome da turma</li>
						<li><code>periodo</code> - Período (Manhã/Tarde/Integral/Noite)</li>
						<li><code>ano_letivo</code> - Ano letivo (ex: 2025)</li>
					</ul>
				</div>
				<div>
					<h4 class="font-semibold mb-2">Processamento:</h4>
					<ul class="list-disc list-inside space-y-1 text-muted-foreground">
						<li>Alunos existentes serão atualizados com novas matrículas</li>
						<li>Novos alunos serão criados automaticamente</li>
						<li>Escolas e turmas serão criadas se não existirem</li>
						<li>Processamento em transação para garantir consistência dos dados</li>
					</ul>
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Upload Form -->
	<Card class="mb-6">
		<CardHeader>
			<CardTitle class="flex items-center gap-2">
				<Upload class="h-5 w-5" />
				Upload da Planilha
			</CardTitle>
			<CardDescription>
				Selecione o arquivo Excel para processar as matrículas
			</CardDescription>
		</CardHeader>
		<CardContent>
			<form
				method="POST"
				enctype="multipart/form-data"
				action="?/uploadFile"
				use:enhance={() => {
					return async ({ result }) => {
						if (result.type === 'failure') {
							console.error('Upload failed:', result);
						}
					};
				}}
				class="space-y-6"
			>
				<div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
					<div class="space-y-4">
						<div class="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
							<FileText class="h-6 w-6 text-gray-600" />
						</div>
						<div>
							<label for="file" class="cursor-pointer">
								<span class="text-primary font-medium hover:underline">
									Clique para selecionar arquivo
								</span>
								<span class="text-muted-foreground"> ou arraste e solte</span>
							</label>
							<input
								type="file"
								id="file"
								name="file"
								accept=".xlsx,.xls"
								on:change={handleFileSelect}
								class="hidden"
								required
							/>
							<p class="text-sm text-muted-foreground mt-2">
								.xlsx ou .xls (máximo 10MB)
							</p>
						</div>
					</div>
				</div>

				<div class="flex justify-end">
					<Button type="submit" disabled={uploadStatus === 'processing'} class="min-w-32">
						{#if uploadStatus === 'processing'}
							<span class="flex items-center gap-2">
								<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
								Processando...
							</span>
						{:else}
							Importar Matrículas
						{/if}
					</Button>
				</div>
			</form>
		</CardContent>
	</Card>

	<!-- Progress Bar (visible during processing) -->
	{#if uploadStatus === 'processing'}
		<Card class="mb-6">
			<CardContent class="pt-6">
				<div class="space-y-2">
					<div class="flex justify-between text-sm">
						<span>Processando arquivo...</span>
						<span>{uploadProgress}%</span>
					</div>
					<Progress value={uploadProgress} class="w-full" />
				</div>
			</CardContent>
		</Card>
	{/if}

	<!-- Results/Errors Display -->
	{#if uploadMessage}
		<Card class="mb-6">
			<CardContent class="pt-6">
				{#if uploadStatus === 'success'}
					<div class="flex items-center gap-2 text-green-600">
						<CheckCircle class="h-5 w-5" />
						<span class="font-medium">Sucesso!</span>
					</div>
				{:else if uploadStatus === 'error'}
					<div class="flex items-center gap-2 text-red-600">
						<AlertCircle class="h-5 w-5" />
						<span class="font-medium">Erro</span>
					</div>
				{/if}
				<p class="mt-2">{uploadMessage}</p>
			</CardContent>
		</Card>
	{/if}

	<!-- Detailed Results -->
	{#if uploadResults}
		<Card class="mb-6">
			<CardHeader>
				<CardTitle>Resultados da Importação</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
					<div class="text-center p-4 bg-blue-50 rounded-lg">
						<div class="text-2xl font-bold text-blue-600">{uploadResults.totalRecords}</div>
						<div class="text-sm text-blue-600">Total de Registros</div>
					</div>
					<div class="text-center p-4 bg-green-50 rounded-lg">
						<div class="text-2xl font-bold text-green-600">{uploadResults.newStudents}</div>
						<div class="text-sm text-green-600">Novos Alunos</div>
					</div>
					<div class="text-center p-4 bg-yellow-50 rounded-lg">
						<div class="text-2xl font-bold text-yellow-600">{uploadResults.updatedStudents}</div>
						<div class="text-sm text-yellow-600">Alunos Atualizados</div>
					</div>
					<div class="text-center p-4 bg-purple-50 rounded-lg">
						<div class="text-2xl font-bold text-purple-600">{uploadResults.newSchools}</div>
						<div class="text-sm text-purple-600">Novas Escolas</div>
					</div>
				</div>

				{#if uploadResults.errors && uploadResults.errors.length > 0}
					<Alert class="mb-4 border-red-200 bg-red-50">
						<AlertCircle class="h-4 w-4 text-red-600" />
						<AlertDescription class="text-red-800">
							Foram encontrados {uploadResults.errors.length} erros durante a importação:
						</AlertDescription>
					</Alert>
					<div class="max-h-48 overflow-y-auto bg-red-50 rounded-lg p-4">
						<ul class="space-y-2 text-sm">
							{#each uploadResults.errors as error}
								<li class="flex items-start gap-2">
									<span class="text-red-600 mt-0.5">•</span>
									<span>
										<strong>Linha {error.row}:</strong> {error.message}
									</span>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			</CardContent>
		</Card>
	{/if}

	<!-- Form Validation Errors -->
	{#if uploadErrors && uploadErrors.length > 0}
		<Alert class="mb-6 border-red-200 bg-red-50">
			<AlertCircle class="h-4 w-4 text-red-600" />
			<AlertDescription class="text-red-800">
				<ul class="list-disc list-inside space-y-1">
					{#each uploadErrors as error}
						<li>{error}</li>
					{/each}
				</ul>
			</AlertDescription>
		</Alert>
	{/if}
</div>