<script setup lang="ts">
import { useTemplateRef } from 'vue'

const { card } = defineProps<{ card: Card, canvas: Canvas }>()
const boxRef = useTemplateRef('box-ref')

defineExpose({ boxRef, active: false })
</script>

<template>
	<div class="card-content">
		<div class="box-name">{{ card.content.name }}</div>
		<div
			ref="box-ref"
			class="box"
			:style="{
				width: `${card.content.width}px`,
				height: `${card.content.height}px`
			}"
		>
			<div class="resize-h"></div>
			<div class="resize-v"></div>
			<div class="resize-d"></div>
		</div>
	</div>
</template>

<style>
.box-name {
	width: max-content;
	padding: .125rem .375rem;
	line-height: 1.25rem;
	font-family: var(--font-content);
	font-weight: bold;
	color: #202020;
	background-color: var(--color-accent);
	border-radius: .375rem;
	box-shadow: var(--shadow);
}

.box {
	position: absolute;
	top: 1.75rem;
	background-color: var(--color-accent-25);
	border: 2px solid var(--color-accent);
	border-radius: .5rem;
	box-shadow: var(--shadow);
	pointer-events: none;
}

.card.selected .box {
	outline: 2px solid var(--color-accent);
	outline-offset: 2px;
}

.resize-d,
.resize-h,
.resize-v {
	position: absolute;
	pointer-events: all;
}

.resize-d {
	right: -.5rem;
	bottom: -.5rem;
	width: .875rem;
	height: .875rem;
	cursor: se-resize;
}

.resize-h {
	top: 0;
	right: -.25rem;
	width: .375rem;
	height: 100%;
	cursor: ew-resize;
}

.resize-v {
	left: 0;
	bottom: -.25rem;
	width: 100%;
	height: .375rem;
	cursor: ns-resize;
}

@media (pointer: coarse) {
	.resize-d {
		scale: 2;
	}

	.resize-h {
		scale: 2 1;
	}

	.resize-v {
		scale: 1 2;
	}
}
</style>
