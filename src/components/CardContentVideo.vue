<script setup lang="ts">
defineProps<{ card: Card, canvas: Canvas }>()
defineExpose({ active: false })
</script>

<template>
	<div class="card-content-video">
		Videos are not supported yet
	</div>
</template>

<style scoped>
.card-content-video {
	width: max-content;
	padding: .375rem;
	background-color: var(--color-card-background);
	border: 2px solid var(--color-card-border);
	border-radius: .375rem;
	box-shadow: var(--shadow);
}

.card.selected .card-content-video {
	border-color: var(--color-accent);
}
</style>
