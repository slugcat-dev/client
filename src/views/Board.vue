<script setup lang="ts">
import { useCache } from '../composables/cache'
import { useRoute } from 'vue-router'
import { useBoard } from '../composables/board'
import { provide } from 'vue'
import BoardHeader from '../components/BoardHeader.vue'
import Canvas from '../components/Canvas.vue'

const cache = useCache()
const route = useRoute()
const board = cache.boards.find(board => board.id === Number(route.params.board))

if (board)
	provide('cards', useBoard(board))
</script>

<template>
	<div v-if="board" class="board">
		<BoardHeader />
		<Canvas />
	</div>
	<div v-else>404</div>
</template>

<style>
.board {
	display: flex;
	width: 100dvw;
	height: 100dvh;
	flex-direction: column;
}
</style>
