<script lang="ts">
	import * as echarts from 'echarts';
	import { onMount, onDestroy } from 'svelte';

	interface Props {
		option: echarts.EChartsOption;
		style?: string;
	}

	let { option, style = 'width: 100%; height: 400px;' }: Props = $props();

	let chartContainer: HTMLDivElement;
	let chartInstance: echarts.ECharts | null = null;

	onMount(() => {
		if (chartContainer) {
			chartInstance = echarts.init(chartContainer);
			chartInstance.setOption(option as any);

			// Handle window resize
			const resizeObserver = new ResizeObserver(() => {
				chartInstance?.resize();
			});
			resizeObserver.observe(chartContainer);

			return () => {
				resizeObserver.disconnect();
			};
		}
	});

	// Reactive updates when option changes
	$effect(() => {
		if (chartInstance && option) {
			chartInstance.setOption(option as any, true); // true = merge options
		}
	});

	onDestroy(() => {
		chartInstance?.dispose();
	});
</script>

<div bind:this={chartContainer} {style}></div>
