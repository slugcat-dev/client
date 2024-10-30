import { createGlobalState } from '@vueuse/core'
import { reactive } from 'vue'

export const useCards = createGlobalState(() => {
	console.log('GET cards')

	const cards = reactive<Card[]>([
		{ id: Date.now(), type: 'text', content: 'Test', pos: { x: 25, y: 100 } },
		{ id: Date.now() + 1, type: 'text', content: 'Hello, **World**!', pos: { x: 100, y: 25 } }
	])

	return cards
})

const cards = useCards()

export function createCard(data: Partial<Card>) {
	const length = cards.push({
		id: 'new',
		type: 'text',
		content: '',
		pos: { x: 0, y: 0},
		...data
	})

	return cards[length - 1]
}

export function updateCard(card: Card) {
	if (card.id === 'new') {
		card.id = Date.now()

		console.log('CREATE', card.id)
	} else
		console.log('UPDATE', card.id)
}

export function updateMany(cards: Card[]) {
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
