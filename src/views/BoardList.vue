<script setup lang="ts">
import { useStorage } from '../composables/storage'
import { useAppState } from '../composables/appState'
import { createBoard, deleteBoard } from '../composables/board'

const storage = await useStorage()
const appState = useAppState()
</script>

<template>
	<div class="board-list">
		<div v-if="storage.boards.length">
			<div v-for="board of storage.boards" style="display: flex; margin-bottom: .5rem;">
				<RouterLink class="board-link ellipsis" :to="`/${board.id}`">
					{{ board.name }}
				</RouterLink>
				<button @click="() => deleteBoard(board)" style="margin-left: .25rem; color: var(--color-red);">
					<svg class="delete-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
						<path fill="currentColor" d="M7 21q-.825 0-1.412-.587T5 19V6q-.425 0-.712-.288T4 5t.288-.712T5 4h4q0-.425.288-.712T10 3h4q.425 0 .713.288T15 4h4q.425 0 .713.288T20 5t-.288.713T19 6v13q0 .825-.587 1.413T17 21zm3-4q.425 0 .713-.288T11 16V9q0-.425-.288-.712T10 8t-.712.288T9 9v7q0 .425.288.713T10 17m4 0q.425 0 .713-.288T15 16V9q0-.425-.288-.712T14 8t-.712.288T13 9v7q0 .425.288.713T14 17" />
					</svg>
				</button>
			</div>
		</div>
		<div v-else style="margin-bottom: .5rem;">No Boards</div>
		<button @click="() => $router.push(createBoard())">Create Board</button>
		<button v-if="!appState.loggedIn" @click="$router.push('/login')">Log In</button>
	</div>
</template>

<style>
.board-list {
	position: fixed;
	top: 50%;
	left: 50%;
	translate: -50% -50%;
}

.board-link {
	display: block;
	width: 240px;
	padding: .25rem .5rem;
	text-decoration: none;
	color: inherit;
	background-color: #80808040;
	border-radius: .375rem;
}

.delete-icon {
	display: flex;
	margin-inline: -.25rem;
}
</style>
