<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useStorage } from '../composables/storage'
import { ofetch } from 'ofetch'
import { nanoid } from 'nanoid'

const apiURL = import.meta.env.APP_API_URL
const storage = await useStorage()
const router = useRouter()

async function createBoard() {
	// TODO: create everything on client
	// TODO: token in cache

	const board = {
		id: nanoid(),
		owner: storage.user?.id ?? 'nope',
		name: 'New Board',
		cards: [],
		created: new Date().toISOString()
	}

	await ofetch(`${apiURL}/board`, {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${storage.token}`
		},
		body: board
	})

	storage.boards.push(board)

	router.push(board.id)
}

// TODO: if logged in
ofetch(`${apiURL}/user/boards`, {
	headers: {
		'Authorization': `Bearer ${storage.token}`
	}
})
</script>

<template>
	<div class="board-list-view">
		<div v-if="storage.boards.length">
			<RouterLink
				v-for="board of storage.boards"
				:to="`/${board.id}`"
			>{{ board.name }} <span class="md-code">{{ board.id }}</span></RouterLink>
		</div>
		<div v-else>No Boards</div>
		<button @click="createBoard">Create Board</button>
	</div>
</template>

<style>
.board-list-view {
	position: fixed;
	top: 50%;
	left: 50%;
	translate: -50% -50%;

	a {
		display: block;
		margin-bottom: .5rem;
	}
}
</style>
