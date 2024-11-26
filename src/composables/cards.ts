import { useAppState } from './appState'
import { useCache } from './cache'
import { createGlobalState } from '@vueuse/core'
import { reactive, watch } from 'vue'

const appState = useAppState()
const storage = useCache()
const storageCards = storage.boards[0].cards

export const useCards = createGlobalState(() => {
	const cards = reactive([...storageCards.map(card => clone(card))])

	return cards
})

const cards = useCards()

// Stack cards in the order they were modified
watch(() => cards.map(card => card.modified), () => {
	cards.sort((a, b) => {
		// Sort boxes before other cards
		if (a.type === 'box' && b.type !== 'box') return -1
    if (a.type !== 'box' && b.type === 'box') return 1

		// Sort boxes by position
		if (a.type === 'box' && b.type === 'box')
			return (a.pos.x + a.pos.y) - (b.pos.x + b.pos.y)

		return a.modified - b.modified
	})
}, { immediate: true })

watch(() => cards.map(card => card.new), () => {
	if (cards.some(card => card.new))
		appState.pendingWork.add('new-cards')
	else
		appState.pendingWork.delete('new-cards')
}, { immediate: true })

export function createCard(data: Partial<Card>) {
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
		storageCards.push(clone(card))

	return cards[cards.push(card) - 1]
}

export function updateCard(card: Card, create = false) {
	const now = Date.now()

	if (create) {
		delete card.new

		storageCards.push(clone(card))
	} else {
		card.modified = now

		if (!card.new)
			storageCards[storageCards.findIndex(c => c.id === card.id)] = clone(card)
	}
}

export function updateMany(cards: Card[]) {
	const now = Date.now()

	cards.sort((a, b) => a.modified - b.modified).forEach((card, i) => card.modified = now + i)
	cards.filter(card => !card.new).forEach(card => storageCards[storageCards.findIndex(c => c.id === card.id)] = clone(card))
}

export function deleteCard(card: Card) {
	if (!card.new)
		storageCards.splice(storageCards.findIndex(c => c.id === card.id), 1)

	cards.splice(cards.findIndex(c => c.id === card.id), 1)
}

export function deleteMany(cardsToDelte: Card[]) {
	cardsToDelte.filter(card => !card.new).forEach(card => {
		storageCards.splice(storageCards.findIndex(c => c.id === card.id), 1)
	})
	cards.splice(0, cards.length, ...cards.filter(card => !cardsToDelte.includes(card)))
}

export function getCardText(cards: Card[]) {
	return cards
		.filter(card => !card.new)
		.map(card => {
			switch (card.type) {
				case 'box': return card.content.label
				case 'text': return card.content.text
				case 'audio':
				case 'video':
				case 'image': return card.content.src
				case 'link': return card.content.url
			}
		})
		.join('\n\n')
}

function clone(obj: any) {
	return JSON.parse(JSON.stringify(obj))
}
