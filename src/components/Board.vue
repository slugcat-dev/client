<script setup lang="ts">
import { useCards } from '../cards'
import Canvas from './Canvas.vue'

const cards = useCards()
</script>

<template>
	<Canvas :cards />
</template>
