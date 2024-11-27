<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useCache } from '../composables/cache'

const cache = useCache()
const router = useRouter()

if (!cache.boards.length)
	router.push(`/${createBoard()}`)

function createBoard() {
	const id = Date.now()

	cache.boards.push({
		id,
		cards: [] as Card[]
	})

	return id
}
</script>

<template>
	<div class="index">
		<RouterLink v-for="board of cache.boards" :to="`/${board.id}`">
			Board <span class="md-code">{{ board.id }}</span> ({{ board.cards.length }})
		</RouterLink>
		<button @click="createBoard">Create Board</button>
	</div>
</template>

<style>
.index {
	display: flex;
	padding: 2rem;
	gap: .25rem;
	flex-direction: column;

	button {
		width: max-content;
		margin-top: .25rem;
	}
}
</style>
