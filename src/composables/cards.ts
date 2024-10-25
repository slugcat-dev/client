import { createGlobalState } from '@vueuse/core'
import { reactive } from 'vue'

export const useCards = createGlobalState(() => {
	console.log('GET cards')

	const cards = reactive<Card[]>([
		{ id: Date.now(), content: 'Test', pos: { x: 25, y: 100 } },
		{ id: Date.now() + 1, content: 'Hello, **World**!', pos: { x: 100, y: 25 } }
	])

	return cards
})

const cards = useCards()

export function createCard(card: Partial<Card>) {
	cards.push({ id: 'new', content: '', pos: { x: 0, y: 0}, ...card })
}

export function updateCard(card: Card) {
	if (card.id === 'new') {
		card.id = Date.now()

		console.log('CREATE', card.id)
	} else
		console.log('UPDATE', card.id)
}

export function deleteCard(id: 'new' | number) {
	if (id !== 'new')
		console.log('DELETE', id)

	cards.splice(cards.findIndex(card => card.id === id), 1)
}
