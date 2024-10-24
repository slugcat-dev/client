<script setup lang="ts">
import { reactive } from 'vue'
import Canvas from './Canvas.vue'

const cards = reactive<Card[]>([
	{ id: 1, content: 'Test', pos: { x: 25, y: 100 } },
	{ id: 2, content: 'Hello, **World**!', pos: { x: 100, y: 25 } }
])
</script>

<template>
	<Canvas :cards />
</template>
