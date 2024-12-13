<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useBoard } from '../composables/board'
import { provide } from 'vue'
import BoardHeader from '../components/BoardHeader.vue'
import Canvas from '../components/Canvas.vue'

const route = useRoute()
const boardContext = await useBoard(route)
const { available } = boardContext

provide('board', boardContext)
</script>

<template>
	<div v-if="available" class="board">
		<BoardHeader />
		<Canvas />
	</div>
	<div v-else class="board not-found">
		<h1>404</h1>
		BOARD NOT FOUND
	</div>
</template>

<style>
.board {
	display: flex;
	width: 100dvw;
	height: 100dvh;
	flex-direction: column;
}

.not-found {
	justify-content: center;
	text-align: center;
	font-family: 'Fira Code', monospace;

	h1 {
		margin: 0;
		font-size: 4rem;
		font-weight: normal;
		filter: drop-shadow(2px 2px 0 #80808080);
	}
}
</style>
