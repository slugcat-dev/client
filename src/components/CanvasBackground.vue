<script setup lang="ts">
import { useSettings } from '../composables/settings'

defineProps<{ scroll: Pos, gridSize: number }>()

const { settings } = useSettings()
</script>

<template>
	<svg v-if="settings.boardBackground !== 'blank'" class="canvas-background">
		<defs>
			<pattern
				id="dot-pattern"
				patternUnits="userSpaceOnUse"
				:x="scroll.x"
				:y="scroll.y"
				:width="gridSize"
				:height="gridSize"
			>
				<circle
					cx=".75"
					cy=".75"
					r=".75"
				/>
			</pattern>
			<pattern
				id="grid-pattern"
				patternUnits="userSpaceOnUse"
				:x="scroll.x"
				:y="scroll.y"
				:width="gridSize"
				:height="gridSize"
			>
				<line
					x1="0"
					y1="0"
					:x2="gridSize"
					y2="0"
					stroke-width=".75"
				/>
				<line
					x1="0"
					y1="0"
					x2="0"
					:y2="gridSize"
					stroke-width=".75"
				/>
			</pattern>
		</defs>
		<rect
			x="0"
			y="0"
			width="100%"
			height="100%"
			:fill="`url(#${settings.boardBackground}-pattern)`"
		/>
	</svg>
</template>

<style>
.canvas-background {
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	pointer-events: none;

	circle {
		fill: #383838;
	}

	line {
		stroke: #383838;
	}
}
</style>
