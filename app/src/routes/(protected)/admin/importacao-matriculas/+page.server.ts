import type { PageServerLoad, Actions } from './$types';
import { error, fail } from '@sveltejs/kit';
import { matriculaImportService } from '$lib/server/services/import-orchestrator.service';

export const load: PageServerLoad = async ({ locals }) => {
	try {
		// Get authenticated session
		const session = await locals.auth();

		// Ensure user is authenticated
		if (!session?.user) {
			throw error(401, 'Não autorizado');
		}

		// Check if user has manager permissions
		const userWithPermissions = session.user as any;
		if (!userWithPermissions.is_gestor) {
			throw error(403, 'Acesso negado. Apenas gestores podem acessar esta página.');
		}

		return {
			user: session.user
		};
	} catch (err) {
		console.error('Error loading import page:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, 'Erro interno ao carregar página de importação');
	}
};

export const actions: Actions = {
	uploadFile: async ({ request, locals }) => {
		try {
			// Authenticate user
			const session = await locals.auth();
			if (!session?.user) {
				return fail(401, {
					status: 'error',
					message: 'Não autorizado',
					errors: ['Autenticação necessária']
				});
			}

			// Check manager permissions
			const userWithPermissions = session.user as any;
			if (!userWithPermissions.is_gestor) {
				return fail(403, {
					status: 'error',
					message: 'Acesso negado',
					errors: ['Apenas gestores podem realizar importações']
				});
			}

			// Parse form data
			const formData = await request.formData();
			const file = formData.get('file') as File;

			if (!file) {
				return fail(400, {
					status: 'error',
					message: 'Nenhum arquivo selecionado',
					errors: ['Por favor, selecione um arquivo para importar']
				});
			}

			// Validate file type
			const validTypes = [
				'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
				'application/vnd.ms-excel', // .xls
				'application/octet-stream' // Sometimes Excel files are sent as this
			];

			if (!validTypes.includes(file.type) && !file.name.toLowerCase().match(/\.(xlsx|xls)$/)) {
				return fail(400, {
					status: 'error',
					message: 'Tipo de arquivo inválido',
					errors: ['Apenas arquivos .xlsx e .xls são permitidos']
				});
			}

			// Validate file size (max 10MB)
			const maxSize = 10 * 1024 * 1024; // 10MB
			if (file.size > maxSize) {
				return fail(400, {
					status: 'error',
					message: 'Arquivo muito grande',
					errors: ['O tamanho máximo permitido é 10MB']
				});
			}

			// Validate minimum file size
			if (file.size === 0) {
				return fail(400, {
					status: 'error',
					message: 'Arquivo vazio',
					errors: ['O arquivo selecionado está vazio']
				});
			}

			// Read file content
			const buffer = await file.arrayBuffer();

			// Pre-validate the file
			const validation = await matriculaImportService.validateFile(buffer, file.name);
			if (!validation.isValid) {
				return fail(400, {
					status: 'error',
					message: 'Arquivo inválido',
					errors: validation.errors
				});
			}

			// Process the import with progress tracking
			let progress = 0;
			let currentMessage = '';

			// Set up progress callback
			matriculaImportService.setProgressCallback((progressValue: number, message: string) => {
				progress = progressValue;
				currentMessage = message;
			});

			// Process the import
			const results = await matriculaImportService.processImport(buffer, file.name);

			// Return success response
			return {
				status: 'success',
				message: `Importação concluída com sucesso! ${results.newStudents + results.updatedStudents} alunos processados.`,
				progress: 100,
				results
			};

		} catch (err) {
			console.error('Import error:', err);

			// Handle specific error types
			if (err instanceof Error) {
				if (err.message.includes('muitos erros de validação')) {
					return fail(400, {
						status: 'error',
						message: 'Muitos erros de validação encontrados',
						errors: [err.message]
					});
				}

				if (err.message.includes('Nenhum registro válido')) {
					return fail(400, {
						status: 'error',
						message: 'Sem dados válidos',
						errors: [err.message]
					});
				}

				if (err.message.includes('Falha ao processar arquivo Excel')) {
					return fail(400, {
						status: 'error',
						message: 'Arquivo corrompido ou inválido',
						errors: ['O arquivo não pôde ser lido corretamente. Verifique se não está corrompido.']
					});
				}

				// Database or other errors
				// Log full error details server-side for debugging
				console.error('Import error:', err);

				return fail(500, {
					status: 'error',
					message: 'Erro durante a importação',
					errors: ['Ocorreu um erro interno. Por favor, contate o suporte técnico.']
				});
			}

			// Unknown error
			return fail(500, {
				status: 'error',
				message: 'Erro desconhecido',
				errors: ['Ocorreu um erro inesperado durante a importação.']
			});
		}
	}
};