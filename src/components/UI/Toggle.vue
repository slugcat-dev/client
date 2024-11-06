<script setup lang="ts">
defineProps({
  modelValue: Boolean,
})

const emit = defineEmits(['update:modelValue'])

const updateValue = (event: Event) => {
  emit('update:modelValue', (event.target as HTMLInputElement).checked)
}
</script>

<template>
	<div class="toggle">
		<input type="checkbox" :checked="modelValue" @change="updateValue">
	</div>
</template>

<style>
.toggle {
	position: relative;
	width: 2.5rem;
	height: 1.5rem;
	background-color: light-dark(#d0d0d0, #404040);
	border-radius: .75rem;
	transition: .2s;

	&::before {
		content: '';
		position: absolute;
		left: 0;
		width: 1rem;
		height: 1rem;
		margin: .25rem;
		background-color: white;
		border-radius: 1rem;
		transition: .2s;
		pointer-events: none;
	}

	&:has(input[type="checkbox"]:checked) {
		background-color: var(--color-accent);
	}

	&:has(input[type="checkbox"]:active)::before {
		width: 2rem;
	}

	&:has(input[type="checkbox"]:checked:not(:active))::before {
		left: 1rem;
	}

	input[type="checkbox"] {
		appearance: none;
		margin: 0;
		width: inherit;
		height: inherit;
	}
}
</style>
