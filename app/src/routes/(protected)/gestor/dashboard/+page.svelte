<script lang="ts">
	import type { PageData } from './$types';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Progress } from '$lib/components/ui/progress/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import EChart from '$lib/components/charts/EChart.svelte';
	import type { EChartsOption } from 'echarts';

	let { data }: { data: PageData } = $props();

	// ============================================================================
	// Anthropometric Chart Configuration
	// ============================================================================
	const anthropometricChartOption: EChartsOption = $derived({
		title: {
			text: 'Classificação Antropométrica (CDC)',
			left: 'center',
			textStyle: { fontSize: 16 }
		},
		tooltip: {
			trigger: 'axis',
			axisPointer: { type: 'shadow' }
		},
		grid: {
			left: '3%',
			right: '4%',
			bottom: '3%',
			containLabel: true
		},
		xAxis: {
			type: 'category',
			data: data.anthropometricStats.map((item) => item.classificacao),
			axisLabel: {
				interval: 0,
				rotate: 15
			}
		},
		yAxis: {
			type: 'value',
			name: 'Número de Alunos'
		},
		series: [
			{
				name: 'Alunos',
				type: 'bar',
				data: data.anthropometricStats.map((item) => ({
					value: item.count,
					itemStyle: {
						color: getAnthropometricColor(item.classificacao)
					}
				})),
				label: {
					show: true,
					position: 'top',
					formatter: '{c}'
				},
				emphasis: {
					focus: 'series'
				}
			}
		]
	});

	function getAnthropometricColor(classificacao: string): string {
		const normalized = classificacao.toLowerCase();
		if (normalized.includes('normal') || normalized.includes('eutrofia')) {
			return '#22c55e'; // Green
		} else if (normalized.includes('sobrepeso') || normalized.includes('risco')) {
			return '#eab308'; // Yellow
		} else {
			return '#ef4444'; // Red (baixo peso, obesidade)
		}
	}

	// ============================================================================
	// Visual Acuity Chart Configuration
	// ============================================================================
	const visualAcuityChartOption: EChartsOption = $derived({
		title: {
			text: 'Distribuição de Acuidade Visual',
			left: 'center',
			textStyle: { fontSize: 16 }
		},
		tooltip: {
			trigger: 'axis',
			axisPointer: { type: 'shadow' }
		},
		legend: {
			data: ['Olho Direito', 'Olho Esquerdo'],
			bottom: 10
		},
		grid: {
			left: '3%',
			right: '4%',
			bottom: '15%',
			containLabel: true
		},
		xAxis: {
			type: 'category',
			data: data.visualAcuityStats.map((item) => item.acuity_range)
		},
		yAxis: {
			type: 'value',
			name: 'Número de Alunos'
		},
		series: [
			{
				name: 'Olho Direito',
				type: 'bar',
				data: data.visualAcuityStats.map((item) => ({
					value: item.olho_direito,
					itemStyle: {
						color: getVisualAcuityColor(item.acuity_range)
					}
				})),
				label: {
					show: true,
					position: 'top'
				}
			},
			{
				name: 'Olho Esquerdo',
				type: 'bar',
				data: data.visualAcuityStats.map((item) => ({
					value: item.olho_esquerdo,
					itemStyle: {
						color: getVisualAcuityColor(item.acuity_range, 0.8)
					}
				})),
				label: {
					show: true,
					position: 'top'
				}
			}
		]
	});

	function getVisualAcuityColor(range: string, opacity: number = 1): string {
		if (range === '<= 0.6') {
			return `rgba(239, 68, 68, ${opacity})`; // Red - Problemático
		} else if (range === '0.61-0.9') {
			return `rgba(234, 179, 8, ${opacity})`; // Yellow - Borderline
		} else {
			return `rgba(34, 197, 94, ${opacity})`; // Green - Normal
		}
	}

	// ============================================================================
	// Dental Risk Chart Configuration
	// ============================================================================
	const dentalRiskChartOption: EChartsOption = $derived({
		title: {
			text: 'Classificação de Risco Odontológico',
			left: 'center',
			textStyle: { fontSize: 16 }
		},
		tooltip: {
			trigger: 'item',
			formatter: '{b}: {c} ({d}%)'
		},
		legend: {
			orient: 'vertical',
			left: 'left',
			top: 'middle'
		},
		series: [
			{
				name: 'Risco',
				type: 'pie',
				radius: ['40%', '70%'],
				avoidLabelOverlap: false,
				itemStyle: {
					borderRadius: 10,
					borderColor: '#fff',
					borderWidth: 2
				},
				label: {
					show: true,
					formatter: '{b}\n{d}%'
				},
				emphasis: {
					label: {
						show: true,
						fontSize: 16,
						fontWeight: 'bold'
					}
				},
				data: data.dentalRiskStats.map((item, index) => ({
					value: item.count,
					name: `Risco ${item.risco}`,
					itemStyle: {
						color: getDentalRiskColor(index)
					}
				}))
			}
		]
	});

	function getDentalRiskColor(index: number): string {
		const colors = [
			'#22c55e', // A - Green
			'#84cc16', // B - Lime
			'#eab308', // C - Yellow
			'#f97316', // D - Orange
			'#ef4444', // E - Red
			'#dc2626', // F - Dark Red
			'#991b1b' // G - Darker Red
		];
		return colors[index] || '#6b7280'; // Default gray
	}

	// ============================================================================
	// Coverage Stats Helpers
	// ============================================================================
	function getCoverageColor(percentage: number): string {
		if (percentage >= 80) return 'bg-green-500';
		if (percentage >= 50) return 'bg-yellow-500';
		return 'bg-red-500';
	}

	function getCoverageTextColor(percentage: number): string {
		if (percentage >= 80) return 'text-green-700';
		if (percentage >= 50) return 'text-yellow-700';
		return 'text-red-700';
	}
</script>

<div class="container mx-auto p-8">
	<!-- Page Header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900">Dashboard do Gestor</h1>
		<p class="mt-2 text-gray-600">
			Visão geral das avaliações de saúde dos alunos - Ano {data.currentYear}
		</p>
	</div>

	<!-- Coverage Statistics Card -->
	{#if data.coverageStats}
		<Card.Root class="mb-8">
			<Card.Header>
				<Card.Title>Cobertura das Avaliações</Card.Title>
				<Card.Description>
					Porcentagem de alunos avaliados por tipo de avaliação (Total: {data.coverageStats
						.total_students} alunos)
				</Card.Description>
			</Card.Header>
			<Card.Content>
				<div class="space-y-6">
					<!-- Anthropometric Coverage -->
					<div>
						<div class="mb-2 flex items-center justify-between">
							<span class="text-sm font-medium">Avaliação Antropométrica</span>
							<span
								class="text-sm font-bold {getCoverageTextColor(
									data.coverageStats.anthropometric_percentage
								)}"
							>
								{data.coverageStats.anthropometric_completed} / {data.coverageStats.total_students} ({data.coverageStats.anthropometric_percentage.toFixed(
									1
								)}%)
							</span>
						</div>
						<Progress value={data.coverageStats.anthropometric_percentage} max={100} />
					</div>

					<!-- Visual Acuity Coverage -->
					<div>
						<div class="mb-2 flex items-center justify-between">
							<span class="text-sm font-medium">Avaliação de Acuidade Visual</span>
							<span
								class="text-sm font-bold {getCoverageTextColor(
									data.coverageStats.visual_percentage
								)}"
							>
								{data.coverageStats.visual_completed} / {data.coverageStats.total_students} ({data.coverageStats.visual_percentage.toFixed(
									1
								)}%)
							</span>
						</div>
						<Progress value={data.coverageStats.visual_percentage} max={100} />
					</div>

					<!-- Dental Coverage -->
					<div>
						<div class="mb-2 flex items-center justify-between">
							<span class="text-sm font-medium">Avaliação Odontológica</span>
							<span
								class="text-sm font-bold {getCoverageTextColor(data.coverageStats.dental_percentage)}"
							>
								{data.coverageStats.dental_completed} / {data.coverageStats.total_students} ({data.coverageStats.dental_percentage.toFixed(
									1
								)}%)
							</span>
						</div>
						<Progress value={data.coverageStats.dental_percentage} max={100} />
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	{/if}

	<!-- Charts Grid -->
	<div class="grid grid-cols-3 gap-8 xl:grid-cols-2 lg:grid-cols-1 md:gap-6">
		<!-- Anthropometric Chart -->
		<Card.Root>
			<Card.Content class="pt-6">
				{#if data.anthropometricStats.length > 0}
					<EChart option={anthropometricChartOption} style="width: 100%; height: 400px;" />
				{:else}
					<div class="flex h-[400px] items-center justify-center text-gray-500">
						Nenhum dado de avaliação antropométrica disponível
					</div>
				{/if}
			</Card.Content>
		</Card.Root>

		<!-- Visual Acuity Chart -->
		<Card.Root>
			<Card.Content class="pt-6">
				{#if data.visualAcuityStats.length > 0}
					<EChart option={visualAcuityChartOption} style="width: 100%; height: 400px;" />
				{:else}
					<div class="flex h-[400px] items-center justify-center text-gray-500">
						Nenhum dado de acuidade visual disponível
					</div>
				{/if}
			</Card.Content>
		</Card.Root>

		<!-- Dental Risk Chart -->
		<Card.Root>
			<Card.Content class="pt-6">
				{#if data.dentalRiskStats.length > 0}
					<EChart option={dentalRiskChartOption} style="width: 100%; height: 400px;" />
				{:else}
					<div class="flex h-[400px] items-center justify-center text-gray-500">
						Nenhum dado de avaliação odontológica disponível
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
</div>
