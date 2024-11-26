<script setup lang="ts">
const model = defineModel()
const { name } = defineProps<{ name?: string }>()
</script>

<template>
	<div class="toggle">
		<input
			type="checkbox"
			:name
			v-model="model"
		>
	</div>
</template>

<style>
.toggle {
	position: relative;
	width: 2.5rem;
	height: 1.5rem;
	background-color: #80808040;
	border-radius: .75rem;
	transition: 200ms;

	&::before {
		content: '';
		position: absolute;
		left: 0;
		width: 1rem;
		height: 1rem;
		margin: .25rem;
		background-color: white;
		border-radius: 1rem;
		transition: 200ms;
		pointer-events: none;
	}

	input {
		appearance: none;
		margin: 0;
		width: inherit;
		height: inherit;
		border-radius: inherit;
		cursor: pointer;
	}

	&:has(:checked) {
		background-color: var(--color-accent);
	}

	&:has(:active)::before {
		width: 2rem;
	}

	&:has(:checked:not(:active))::before {
		left: 1rem;
	}
}
</style>
