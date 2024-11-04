<script setup lang="ts">
import { useCards } from '../composables/cards'
import BoardHeader from './BoardHeader.vue'
import Canvas from './Canvas.vue'

const cards = useCards()
</script>

<template>
	<div class="board">
		<BoardHeader />
		<Canvas :cards />
	</div>
</template>

<style>
.board {
	display: flex;
	width: 100dvw;
	height: 100dvh;
	flex-direction: column;
}
</style>
