import { createCard } from './composables/cards'

/**
 * Copy the given cards to the clipboard.
 */
export function copyCards(cards: Card[]) {
	// The clipboard API doesn't support custom types, so we do some trickery
	document.addEventListener('copy', (event) => {
		if (!event.clipboardData)
			return

		// Sort cards in reading order
		cards.sort((a, b) => {
			if (a.pos.x !== b.pos.x)
				return a.pos.x - b.pos.x

			return a.pos.y - b.pos.y
		})

		event.preventDefault()
		event.clipboardData.setData('text/plain', cards.map(card => card.content).join('\n\n'))
		event.clipboardData.setData('cards', JSON.stringify(cards.map(card => ({
			type: card.type,
			pos: card.pos,
			content: card.content
		}))))
	}, { once: true })
	document.execCommand('copy')
}

/**
 * Paste content from the clipboard or drag and drop on the canvas.
 */
export async function pasteOnCanvas(canvas: Canvas, dataTransfer: DataTransfer | null, pointer: PointerState): Promise<Card[]> {
	if (!dataTransfer)
		return []

	const items = Array.from(dataTransfer.items)
	const cardsItem = items.find(item => item.type === 'cards')

	// Paste copied cards directly
	if (cardsItem) {
		try {
			const data = await getAsString(cardsItem)
			const cards = JSON.parse(data) as Card[]

			if (!cards.length)
				return []

			const corner = cards[0].pos
			const pos = canvas.toCanvasPos(pointer)

			return cards.map((card, i) => {
				return createCard({
					id: Date.now() + i,
					type: card.type,
					pos: {
						x: pos.x + card.pos.x - corner.x,
						y: pos.y + card.pos.y - corner.y
					},
					content: card.content
				})
			})
		} catch {}
	}

	for (const item of items)
		console.log(item.type)

	return []
}

function getAsString(item: DataTransferItem) {
	return new Promise<string>(resolve => item.getAsString(resolve))
}

function getAsFile(item: DataTransferItem) {
	return new Promise<File | null>(resolve => resolve(item.getAsFile()))
}
