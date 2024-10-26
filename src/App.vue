<script setup lang="ts">
import { provide } from 'vue'
import { usePointer } from './composables/pointer'
import Board from './components/Board.vue'

// Use global pointer state instead of having listeners for each card
const { pointer, pointers } = usePointer()

provide('pointer', pointer)
provide('pointers', pointers)
</script>

<template>
	<main>
		<Board />
	</main>
</template>
