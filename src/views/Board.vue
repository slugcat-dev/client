<script setup lang="ts">
import { useCache } from '../composables/cache'
import { useRoute, useRouter } from 'vue-router'
import { useAppState } from '../composables/appState'
import { provide, reactive, watch } from 'vue'
import { clone } from '../utils'
import BoardHeader from '../components/BoardHeader.vue'
import Canvas from '../components/Canvas.vue'

const cache = useCache()
const route = useRoute()
const appState = useAppState()
const board = cache.boards.find(board => board.id === Number(route.params.board))!

if (board) {
	const cards = reactive([...board.cards.map(card => clone(card))])

	watch(() => cards.map(card => card.new), () => {
		if (cards.some(card => card.new))
			appState.pendingWork.add('new-cards')
		else
			appState.pendingWork.delete('new-cards')
	}, { immediate: true })

	function createCard(data: Partial<Card>) {
		const now = Date.now()
		const card = {
			id: now,
			type: 'text',
			content: { text: '' },
			pos: { x: 0, y: 0 },
			modified: now,
			...data
		} as Card

		if (!card.new)
			board.cards.push(clone(card))

		return cards[cards.push(card) - 1]
	}

	function updateCard(card: Card, create = false) {
		const now = Date.now()

		if (create) {
			delete card.new

			board.cards.push(clone(card))
		} else {
			card.modified = now

			if (!card.new)
				board.cards[board.cards.findIndex(c => c.id === card.id)] = clone(card)
		}
	}

	function updateMany(cards: Card[]) {
		const now = Date.now()

		cards.sort((a, b) => a.modified - b.modified).forEach((card, i) => card.modified = now + i)
		cards.filter(card => !card.new).forEach(card => board.cards[board.cards.findIndex(c => c.id === card.id)] = clone(card))
	}

	function deleteCard(card: Card) {
		if (!card.new)
			board.cards.splice(board.cards.findIndex(c => c.id === card.id), 1)

		cards.splice(cards.findIndex(c => c.id === card.id), 1)
	}

	function deleteMany(cardsToDelte: Card[]) {
		cardsToDelte.filter(card => !card.new).forEach(card => {
			board.cards.splice(board.cards.findIndex(c => c.id === card.id), 1)
		})
		cards.splice(0, cards.length, ...cards.filter(card => !cardsToDelte.includes(card)))
	}

	provide('cards', {
		cards,
		createCard,
		updateCard,
		updateMany,
		deleteCard,
		deleteMany
	})
} else
	useRouter().push('/')
</script>

<template>
	<div v-if="board" class="board">
		<BoardHeader />
		<Canvas />
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
