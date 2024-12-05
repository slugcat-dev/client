<script setup lang="ts">
import { useStorage } from '../composables/storage'
import { useRoute } from 'vue-router'
import { useBoard } from '../composables/board'
import { provide } from 'vue'
import BoardHeader from '../components/BoardHeader.vue'
import Canvas from '../components/Canvas.vue'

const storage = await useStorage()
const route = useRoute()
const board = storage.boards.find(board => board.id === route.params.board)

if (board)
	provide('cards', useBoard(board))
</script>

<template>
	<div v-if="board" class="board-view">
		<BoardHeader />
		<Canvas />
	</div>
	<div v-else>404</div>
</template>

<style>
.board-view {
	display: flex;
	width: 100dvw;
	height: 100dvh;
	flex-direction: column;
}
</style>
