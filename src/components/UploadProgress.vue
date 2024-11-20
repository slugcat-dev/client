<script setup lang="ts">
import { useTemplateRef, watch } from 'vue'

const { uploading, retry, progress } = defineProps<{ uploading: boolean, retry: boolean, progress: number }>()
const emit = defineEmits(['retry'])
const progressRingRef = useTemplateRef('progress-ring-ref')

watch(() => progress, updateProgress)

function updateProgress() {
	const circle = progressRingRef.value

	if (!circle)
		return

	const r = circle.r.baseVal.value
	const c = 2 * Math.PI * r
	const offset = c - progress / 100 * c

	circle.style.strokeDasharray = `${c}, ${c}`
	circle.style.strokeDashoffset = `${offset}`
	circle.style.animation = 'none'
}
</script>

<template>
	<div v-if="uploading" class="upload-progress">
		<svg class="upload-icon">
			<circle ref="progress-ring-ref" class="progress-ring" cx="50%" cy="50%" r="33%" stroke-dasharray="100%" style="animation: spin 750ms linear infinite;" />
		</svg>
		<div>Uploading...</div>
	</div>
	<div
		v-if="retry"
		class="upload-retry"
		@click="emit('retry')"
	>
		<svg class="retry-icon" width="16" height="16" viewBox="0 0 16 16">
			<path fill="currentColor" d="M 8,16 Q 4.65,16 2.32,13.68 0,11.35 0,8 0,4.65 2.32,2.33 4.65,0 8,0 q 1.72,0 3.3,0.71 1.57,0.71 2.7,2.04 V 1 q 0,-0.43 0.29,-0.71 0.29,-0.29 0.71,-0.29 0.42,-0 0.71,0.29 0.29,0.29 0.29,0.71 V 6 q 0,0.43 -0.29,0.71 -0.29,0.29 -0.71,0.29 H 10 q -0.42,0 -0.71,-0.29 Q 9,6.42 9,6 9,5.58 9.29,5.29 9.58,5 10,5 h 3.2 q -0.8,-1.4 -2.19,-2.2 -1.39,-0.8 -3.01,-0.8 -2.5,0 -4.25,1.75 -1.75,1.75 -1.75,4.25 0,2.5 1.75,4.25 Q 5.5,14 8,14 q 1.7,0 3.11,-0.86 1.41,-0.86 2.19,-2.31 0.2,-0.35 0.56,-0.49 0.36,-0.14 0.74,-0.01 0.4,0.13 0.57,0.53 0.17,0.4 -0.02,0.75 -1.02,2 -2.92,3.2 Q 10.33,16 8,16" />
		</svg>
		<div>Retry Upload</div>
	</div>
</template>

<style>
.upload-progress,
.upload-retry {
	display: flex;
	position: absolute;
	top: .375rem;
	left: .375rem;
	padding-inline-end: .5rem;
	gap: .5rem;
	align-items: center;
	color: #202020;
	background-color: white;
	border-radius: 1rem;
	box-shadow: var(--shadow);
	z-index: 1;
}

.upload-icon,
.retry-icon {
	display: block;
	width: 1.5rem;
	height: 1.5rem;
}

.upload-icon .progress-ring {
	fill: none;
	stroke: currentColor;
	stroke-width: 2px;
	stroke-linecap: round;
	stroke-linejoin: round;
	transform: rotate(-90deg);
	transform-origin: center;
}

.retry-icon {
	padding: .25rem;
}

.upload-retry {
	font-weight: bold;
	background-color: var(--color-red);
	cursor: pointer;
}
</style>
