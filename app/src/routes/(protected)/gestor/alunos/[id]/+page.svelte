<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import UserIcon from '@lucide/svelte/icons/user';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import SchoolIcon from '@lucide/svelte/icons/school';
	import WeightIcon from '@lucide/svelte/icons/weight';
	import RulerIcon from '@lucide/svelte/icons/ruler';
	import EyeIcon from '@lucide/svelte/icons/eye';
	import SmileIcon from '@lucide/svelte/icons/smile';
	import EChart from '$lib/components/charts/EChart.svelte';
	import type * as echarts from 'echarts';

	interface StudentData {
		studentInfo: {
			id: number;
			nome_completo: string;
			data_nascimento: Date;
			sexo: 'Masculino' | 'Feminino';
			escola_id: number;
			escola_nome: string;
			ano_letivo: number;
			turma?: string;
			periodo?: string;
		} | null;
		anthropometricHistory: Array<{
			id: number;
			data_avaliacao: Date;
			peso_kg: number;
			altura_cm: number;
			imc: number;
			classificacao_cdc?: string;
			ano_referencia: number;
		}>;
		visualHistory: Array<{
			id: number;
			data_avaliacao: Date;
			olho_direito?: number;
			olho_esquerdo?: number;
			reteste?: number;
			ano_referencia: number;
		}>;
		dentalHistory: Array<{
			id: number;
			data_avaliacao: Date;
			risco?: string;
			atf_realizado: boolean;
			necessita_art: boolean;
			art_quantidade_dentes?: number;
			escovacao_orientada_realizada: boolean;
			ano_referencia: number;
		}>;
	}

	let { data }: { data: StudentData } = $props();

	// Format date for display
	function formatDate(date: Date): string {
		return new Date(date).toLocaleDateString('pt-BR');
	}

	// Calculate age from birth date
	function calculateAge(birthDate: Date): number {
		const today = new Date();
		const birth = new Date(birthDate);
		let age = today.getFullYear() - birth.getFullYear();
		const monthDiff = today.getMonth() - birth.getMonth();
		if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
			age--;
		}
		return age;
	}

	// Generate anthropometric chart options
	function getAnthropometricChartOptions(): echarts.EChartsOption {
		const dates = data.anthropometricHistory.map(h => formatDate(h.data_avaliacao));
		const weights = data.anthropometricHistory.map(h => h.peso_kg);
		const heights = data.anthropometricHistory.map(h => h.altura_cm);
		const bmis = data.anthropometricHistory.map(h => h.imc);

		return {
			title: {
				text: 'Evolução Antropométrica',
				left: 'center'
			},
			tooltip: {
				trigger: 'axis',
				axisPointer: {
					type: 'cross'
				}
			},
			legend: {
				data: ['Peso (kg)', 'Altura (cm)', 'IMC'],
				bottom: 0
			},
			xAxis: {
				type: 'category',
				data: dates,
				axisLabel: {
					rotate: 45
				}
			},
			yAxis: [
				{
					type: 'value',
					name: 'Peso (kg)',
					position: 'left',
					axisLine: {
						show: true,
						lineStyle: {
							color: '#5470c6'
						}
					}
				},
				{
					type: 'value',
					name: 'Altura (cm)',
					position: 'right',
					axisLine: {
						show: true,
						lineStyle: {
							color: '#91cc75'
						}
					}
				}
			],
			series: [
				{
					name: 'Peso (kg)',
					type: 'line',
					data: weights,
					smooth: true,
					itemStyle: {
						color: '#5470c6'
					}
				},
				{
					name: 'Altura (cm)',
					type: 'line',
					yAxisIndex: 1,
					data: heights,
					smooth: true,
					itemStyle: {
						color: '#91cc75'
					}
				},
				{
					name: 'IMC',
					type: 'line',
					data: bmis,
					smooth: true,
					itemStyle: {
						color: '#fac858'
					}
				}
			]
		};
	}

	// Generate visual acuity chart options
	function getVisualChartOptions(): echarts.EChartsOption {
		const dates = data.visualHistory.map(h => formatDate(h.data_avaliacao));
		const rightEye = data.visualHistory.map(h => h.olho_direito || null);
		const leftEye = data.visualHistory.map(h => h.olho_esquerdo || null);
		const retest = data.visualHistory.map(h => h.reteste || null);

		return {
			title: {
				text: 'Evolução da Acuidade Visual',
				left: 'center'
			},
			tooltip: {
				trigger: 'axis',
				axisPointer: {
					type: 'cross'
				},
				formatter: function(params: any) {
					let result = params[0].axisValue + '<br/>';
					params.forEach((param: any) => {
						if (param.value !== null) {
							result += `${param.marker} ${param.seriesName}: ${param.value}<br/>`;
						}
					});
					return result;
				}
			},
			legend: {
				data: ['Olho Direito', 'Olho Esquerdo', 'Reteste'],
				bottom: 0
			},
			xAxis: {
				type: 'category',
				data: dates,
				axisLabel: {
					rotate: 45
				}
			},
			yAxis: {
				type: 'value',
				name: 'Acuidade Visual',
				min: 0,
				max: 1.2,
				axisLabel: {
					formatter: '{value}'
				}
			},
			series: [
				{
					name: 'Olho Direito',
					type: 'line',
					data: rightEye,
					smooth: true,
					connectNulls: false,
					itemStyle: {
						color: '#5470c6'
					}
				},
				{
					name: 'Olho Esquerdo',
					type: 'line',
					data: leftEye,
					smooth: true,
					connectNulls: false,
					itemStyle: {
						color: '#91cc75'
					}
				},
				{
					name: 'Reteste',
					type: 'line',
					data: retest,
					smooth: true,
					connectNulls: false,
					itemStyle: {
						color: '#ee6666'
					}
				}
			],
			markLine: {
				data: [
					{
						yAxis: 0.6,
						name: 'Limiar Problema (≤0.6)',
						lineStyle: {
							color: '#ee6666',
							type: 'dashed'
						},
						label: {
							formatter: 'Limiar: 0.6'
						}
					},
					{
						yAxis: 1.0,
						name: 'Normal (≥1.0)',
						lineStyle: {
							color: '#91cc75',
							type: 'dashed'
						},
						label: {
							formatter: 'Normal: 1.0'
						}
					}
				]
			}
		};
	}

	// Generate dental risk chart options
	function getDentalChartOptions(): echarts.EChartsOption {
		// Map risk levels to numeric values for visualization
		const riskMap: { [key: string]: number } = {
			'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7
		};

		const dates = data.dentalHistory.map(h => formatDate(h.data_avaliacao));
		const risks = data.dentalHistory.map(h => h.risco ? riskMap[h.risco] || 0 : 0);
		const atfDone = data.dentalHistory.map(h => h.atf_realizado ? 1 : 0);
		const needsART = data.dentalHistory.map(h => h.necessita_art ? 1 : 0);

		return {
			title: {
				text: 'Evolução da Avaliação Odontológica',
				left: 'center'
			},
			tooltip: {
				trigger: 'axis',
				axisPointer: {
					type: 'cross'
				},
				formatter: function(params: any) {
					let result = params[0].axisValue + '<br/>';
					const dentalData = data.dentalHistory[params[0].dataIndex];

					params.forEach((param: any) => {
						if (param.seriesName === 'Risco') {
							const riskLevel = ['A', 'B', 'C', 'D', 'E', 'F', 'G'][param.value - 1] || 'N/A';
							result += `${param.marker} ${param.seriesName}: ${riskLevel}<br/>`;
						} else if (param.value === 1) {
							result += `${param.marker} ${param.seriesName}: Sim<br/>`;
						}
					});

					if (dentalData.art_quantidade_dentes) {
						result += `Quantidade ART: ${dentalData.art_quantidade_dentes}<br/>`;
					}
					return result;
				}
			},
			legend: {
				data: ['Risco (A-G)', 'ATF Realizado', 'Necessita ART'],
				bottom: 0
			},
			xAxis: {
				type: 'category',
				data: dates,
				axisLabel: {
					rotate: 45
				}
			},
			yAxis: [
				{
					type: 'value',
					name: 'Nível de Risco',
					min: 0,
					max: 8,
					axisLabel: {
						formatter: function(value: number) {
							return ['N/A', 'A', 'B', 'C', 'D', 'E', 'F', 'G'][value] || '';
						}
					}
				},
				{
					type: 'value',
					name: 'Procedimentos',
					min: 0,
					max: 1.2,
					axisLabel: {
						formatter: function(value: number) {
							return value === 1 ? 'Sim' : (value === 0 ? 'Não' : '');
						}
					}
				}
			],
			series: [
				{
					name: 'Risco (A-G)',
					type: 'line',
					data: risks,
					smooth: true,
					step: 'middle',
					itemStyle: {
						color: '#5470c6'
					}
				},
				{
					name: 'ATF Realizado',
					type: 'bar',
					yAxisIndex: 1,
					data: atfDone,
					itemStyle: {
						color: '#91cc75'
					}
				},
				{
					name: 'Necessita ART',
					type: 'bar',
					yAxisIndex: 1,
					data: needsART,
					itemStyle: {
						color: '#ee6666'
					}
				}
			]
		};
	}
</script>

<svelte:head>
	<title>Histórico do Aluno - {data.studentInfo?.nome_completo}</title>
</svelte:head>

<div class="container mx-auto p-6 space-y-6">
	<!-- Header with navigation -->
	<div class="flex items-center justify-between">
		<div class="flex items-center space-x-4">
			<Button variant="ghost" size="sm" onclick={() => goto('/gestor/relatorios')}>
				<ArrowLeftIcon class="h-4 w-4 mr-2" />
				Voltar
			</Button>
			<h1 class="text-3xl font-bold">Histórico do Aluno</h1>
		</div>
	</div>

	{#if data.studentInfo}
		<!-- Student Information Card -->
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center space-x-2">
					<UserIcon class="h-5 w-5" />
					<span>Informações do Aluno</span>
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					<div>
						<p class="text-sm font-medium text-muted-foreground">Nome</p>
						<p class="text-lg font-semibold">{data.studentInfo.nome_completo}</p>
					</div>
					<div>
						<p class="text-sm font-medium text-muted-foreground">Idade</p>
						<p class="text-lg font-semibold">{calculateAge(data.studentInfo.data_nascimento)} anos</p>
					</div>
					<div>
						<p class="text-sm font-medium text-muted-foreground">Sexo</p>
						<Badge variant={data.studentInfo.sexo === 'Masculino' ? 'default' : 'secondary'}>
							{data.studentInfo.sexo}
						</Badge>
					</div>
					<div>
						<p class="text-sm font-medium text-muted-foreground">Escola</p>
						<p class="text-lg font-semibold">{data.studentInfo.escola_nome}</p>
					</div>
					<div>
						<p class="text-sm font-medium text-muted-foreground">Ano Letivo</p>
						<p class="text-lg font-semibold">{data.studentInfo.ano_letivo}</p>
					</div>
					{#if data.studentInfo.turma}
						<div>
							<p class="text-sm font-medium text-muted-foreground">Turma</p>
							<p class="text-lg font-semibold">{data.studentInfo.turma}</p>
						</div>
					{/if}
					{#if data.studentInfo.periodo}
						<div>
							<p class="text-sm font-medium text-muted-foreground">Período</p>
							<p class="text-lg font-semibold">{data.studentInfo.periodo}</p>
						</div>
					{/if}
				</div>
			</CardContent>
		</Card>

		<!-- Anthropometric History Chart -->
		{#if data.anthropometricHistory.length > 0}
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center space-x-2">
						<WeightIcon class="h-5 w-5" />
						<span>Evolução Antropométrica</span>
					</CardTitle>
					<CardDescription>
						Histórico de peso, altura e IMC ao longo do tempo
					</CardDescription>
				</CardHeader>
				<CardContent>
					<EChart option={getAnthropometricChartOptions()} style="width: 100%; height: 500px;" />
				</CardContent>
			</Card>
		{:else}
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center space-x-2">
						<WeightIcon class="h-5 w-5" />
						<span>Evolução Antropométrica</span>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p class="text-muted-foreground text-center py-8">
						Nenhum dado antropométrico encontrado para este aluno.
					</p>
				</CardContent>
			</Card>
		{/if}

		<!-- Visual Acuity History Chart -->
		{#if data.visualHistory.length > 0}
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center space-x-2">
						<EyeIcon class="h-5 w-5" />
						<span>Evolução da Acuidade Visual</span>
					</CardTitle>
					<CardDescription>
						Histórico de acuidade visual para ambos os olhos
					</CardDescription>
				</CardHeader>
				<CardContent>
					<EChart option={getVisualChartOptions()} style="width: 100%; height: 500px;" />
				</CardContent>
			</Card>
		{:else}
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center space-x-2">
						<EyeIcon class="h-5 w-5" />
						<span>Evolução da Acuidade Visual</span>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p class="text-muted-foreground text-center py-8">
						Nenhum dado de acuidade visual encontrado para este aluno.
					</p>
				</CardContent>
			</Card>
		{/if}

		<!-- Dental History Chart -->
		{#if data.dentalHistory.length > 0}
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center space-x-2">
						<SmileIcon class="h-5 w-5" />
						<span>Evolução Odontológica</span>
					</CardTitle>
					<CardDescription>
						Histórico de risco e procedimentos odontológicos
					</CardDescription>
				</CardHeader>
				<CardContent>
					<EChart option={getDentalChartOptions()} style="width: 100%; height: 500px;" />
				</CardContent>
			</Card>
		{:else}
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center space-x-2">
						<SmileIcon class="h-5 w-5" />
						<span>Evolução Odontológica</span>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p class="text-muted-foreground text-center py-8">
						Nenhum dado odontológico encontrado para este aluno.
					</p>
				</CardContent>
			</Card>
		{/if}
	{:else}
		<Card>
			<CardContent class="text-center py-8">
				<p class="text-muted-foreground">Aluno não encontrado.</p>
			</CardContent>
		</Card>
	{/if}
</div>