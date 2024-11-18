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

	circle.style.strokeDasharray = `${c} ${c}`
	circle.style.strokeDashoffset = `${offset}`
}
</script>

<template>
	<div v-if="uploading" class="upload-progress">
		<svg class="upload-icon">
			<circle ref="progress-ring-ref" class="progress-ring" cx="50%" cy="50%" r="33%" stroke-dasharray="100 100" stroke-dashoffset="100" />
		</svg>
		<div>Uploading...</div>
	</div>
	<div
		v-if="retry"
		class="upload-retry"
		@click="emit('retry')"
	>
		<svg class="retry-icon">
			<ellipse cx="50%" cy="50%" rx="33%" ry="33%" stroke-dasharray="155% 55%" />
  		<path d="M 19,2 19,8 13,8" />
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
	padding: .25rem;
	padding-inline-end: .75rem;
	gap: .5rem;
	align-items: center;
	color: #d0d0d0;
	background-color: #181818;
	border: 1px solid #202020;
	border-radius: 1rem;
	box-shadow: var(--shadow);
	z-index: 1;

	.upload-icon,
	.retry-icon {
		display: block;
		width: 1.5rem;
		height: 1.5rem;
	}

	.upload-icon .progress-ring,
	.retry-icon ellipse,
	.retry-icon path {
		fill: none;
		stroke: currentcolor;
		stroke-width: 2px;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.upload-icon .progress-ring {
		transform: rotate(-90deg);
		transform-origin: center;
	}

	.retry-icon ellipse {
		transform: rotate(45deg);
		transform-origin: center;
	}
}

.upload-retry {
	color: var(--color-red);
	cursor: pointer;
}
</style>
