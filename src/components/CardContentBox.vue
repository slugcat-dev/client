<script setup lang="ts">
import { useTemplateRef } from 'vue'

const { card } = defineProps<{ card: Card, canvas: Canvas }>()
const boxRef = useTemplateRef('box-ref')

defineExpose({ boxRef, active: false })
</script>

<template>
	<div class="box-label">{{ card.content.label }}</div>
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
</template>

<style scoped>
.box-label {
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
</style>
