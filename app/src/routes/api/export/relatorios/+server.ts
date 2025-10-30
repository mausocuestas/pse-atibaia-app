import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getFilteredStudents } from '$lib/server/db/queries/reports';
import * as XLSX from 'xlsx';

/**
 * API endpoint for exporting filtered student reports to XLSX format
 * POST /api/export/relatorios
 *
 * Requires manager authentication (is_gestor=true)
 * Accepts same filter parameters as reports query
 * Returns XLSX file as binary download
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	// Authentication check
	const session = await locals.auth();

	if (!session?.user) {
		return error(401, 'Não autorizado - faça login');
	}

	// Check if user has manager permissions
	const userWithPermissions = session.user as any;
	if (!userWithPermissions.is_gestor) {
		return error(403, 'Acesso negado - apenas gestores podem exportar relatórios');
	}

	try {
		// Parse request body for filters
		const body = await request.json();
		const {
			escolaId,
			anoLetivo,
			turma,
			periodo,
			evaluationTypes,
			cdcClassification,
			visualAcuityRange,
			dentalRisk
		} = body;

		// Fetch ALL filtered results (no pagination for export)
		const { results, total } = await getFilteredStudents({
			escolaId,
			anoLetivo,
			turma,
			periodo,
			evaluationTypes,
			cdcClassification,
			visualAcuityRange,
			dentalRisk,
			limit: 10000, // High limit to get all results
			offset: 0
		});

		if (results.length === 0) {
			return error(404, 'Nenhum resultado encontrado com os filtros aplicados');
		}

		// Prepare data for Excel with Brazilian formatting
		const excelData = results.map((student) => ({
			'Nome Completo': student.cliente,
			'Data de Nascimento': new Date(student.data_nasc).toLocaleDateString('pt-BR'),
			'Sexo': student.sexo,
			'Escola': student.escola_nome,
			'Ano Letivo': student.ano_letivo,
			'Turma': student.turma || '-',
			'Período': student.periodo || '-',
			'Avaliação Antropométrica': student.has_anthropometric ? 'Sim' : 'Não',
			'Classificação CDC': student.classificacao_cdc || '-',
			'Avaliação Visual': student.has_visual ? 'Sim' : 'Não',
			'Acuidade Visual OD': student.olho_direito !== null && student.olho_direito !== undefined
				? student.olho_direito.toString()
				: '-',
			'Acuidade Visual OE': student.olho_esquerdo !== null && student.olho_esquerdo !== undefined
				? student.olho_esquerdo.toString()
				: '-',
			'Avaliação Odontológica': student.has_dental ? 'Sim' : 'Não',
			'Risco Dental': student.risco_dental || '-'
		}));

		// Create workbook and worksheet
		const workbook = XLSX.utils.book_new();
		const worksheet = XLSX.utils.json_to_sheet(excelData);

		// Set column widths for better readability
		const columnWidths = [
			{ wch: 30 }, // Nome Completo
			{ wch: 15 }, // Data de Nascimento
			{ wch: 10 }, // Sexo
			{ wch: 40 }, // Escola
			{ wch: 12 }, // Ano Letivo
			{ wch: 10 }, // Turma
			{ wch: 15 }, // Período
			{ wch: 20 }, // Avaliação Antropométrica
			{ wch: 20 }, // Classificação CDC
			{ wch: 15 }, // Avaliação Visual
			{ wch: 18 }, // Acuidade Visual OD
			{ wch: 18 }, // Acuidade Visual OE
			{ wch: 20 }, // Avaliação Odontológica
			{ wch: 15 }  // Risco Dental
		];
		worksheet['!cols'] = columnWidths;

		// Add worksheet to workbook
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório de Alunos');

		// Create filter summary sheet
		const filterSummary = [
			{ 'Critério': 'Total de Resultados', 'Valor': total },
			{ 'Critério': 'Escola', 'Valor': escolaId || 'Todas' },
			{ 'Critério': 'Ano Letivo', 'Valor': anoLetivo || 'Todos' },
			{ 'Critério': 'Turma', 'Valor': turma || 'Todas' },
			{ 'Critério': 'Período', 'Valor': periodo || 'Todos' },
			{
				'Critério': 'Tipos de Avaliação',
				'Valor': evaluationTypes && evaluationTypes.length > 0
					? evaluationTypes.join(', ')
					: 'Todas'
			},
			{
				'Critério': 'Classificação CDC',
				'Valor': cdcClassification && cdcClassification.length > 0
					? cdcClassification.join(', ')
					: 'Todas'
			},
			{
				'Critério': 'Risco Dental',
				'Valor': dentalRisk && dentalRisk.length > 0 ? dentalRisk.join(', ') : 'Todos'
			},
			{ 'Critério': 'Data de Exportação', 'Valor': new Date().toLocaleString('pt-BR') }
		];

		const filterSheet = XLSX.utils.json_to_sheet(filterSummary);
		filterSheet['!cols'] = [{ wch: 25 }, { wch: 50 }];
		XLSX.utils.book_append_sheet(workbook, filterSheet, 'Filtros Aplicados');

		// Generate binary Excel file
		const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

		// Generate filename with timestamp
		const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
		const filename = `relatorio-pse-${timestamp}.xlsx`;

		// Return file as download
		return new Response(excelBuffer, {
			status: 200,
			headers: {
				'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
				'Content-Disposition': `attachment; filename="${filename}"`,
				'Content-Length': excelBuffer.length.toString()
			}
		});
	} catch (err) {
		console.error('Erro ao gerar exportação XLSX:', err);
		return error(500, 'Erro ao gerar arquivo de exportação');
	}
};
