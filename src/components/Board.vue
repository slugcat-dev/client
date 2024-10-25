<script setup lang="ts">
import { useCards } from '../composables/cards'
import Canvas from './Canvas.vue'

const cards = useCards()
</script>

<template>
	<Canvas :cards />
</template>
