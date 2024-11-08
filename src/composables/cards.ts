import { createGlobalState } from '@vueuse/core'
import { reactive, watch } from 'vue'

export const useCards = createGlobalState(() => {
	console.log('GET cards')

	const now = Date.now()
	const cards = reactive<Card[]>([
		{ id: now, type: 'text', content: 'Test', pos: { x: 25, y: 100 }, modified: now },
		{ id: now + 1, type: 'text', content: 'Hello, **World**!', pos: { x: 100, y: 25 }, modified: now }
	])

	return cards
})

const cards = useCards()

// Stack cards in the order they were modified
watch(cards, () => {
	cards.sort((a, b) => a.modified - b.modified)
}, { deep: true })

export function createCard(data: Partial<Card>) {
	const now = Date.now()

	const length = cards.push({
		id: now,
		type: 'text',
		content: '',
		pos: { x: 0, y: 0 },
		modified: now,
		...data
	})

	return cards[length - 1]
}

export function updateCard(card: Card) {
	const now = Date.now()

	card.modified = now

	if (card.id === 'new') {
		card.id = now

		console.log('CREATE', card.id)
	} else
		console.log('UPDATE', card.id)
}

export function updateMany(cards: Card[]) {
	const now = Date.now()

	cards.sort((a, b) => a.modified - b.modified).forEach((card, i) => card.modified = now + i)
	console.log('UPDATE', ...cards.map(card => card.id))
}

export function deleteCard(id: 'new' | number) {
	if (id !== 'new')
		console.log('DELETE', id)

	cards.splice(cards.findIndex(card => card.id === id), 1)
}

export function deleteMany(cardsToDelte: Card[]) {
	console.log('DELETE', ...cardsToDelte.map(card => card.id))
	cards.splice(0, cards.length, ...cards.filter(card => !cardsToDelte.includes(card)))
}
