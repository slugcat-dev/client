import { useAppState } from './appState'
import { reactive, watch } from 'vue'
import { clone } from '../utils'

const appState = useAppState()

export function useBoard(board: Board) {
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

	return {
		board,
		cards,
		createCard,
		updateCard,
		updateMany,
		deleteCard,
		deleteMany
	}
}
