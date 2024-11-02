import { createCard } from './composables/cards'
import { fileToBase64, isURL, loadImage } from './utils'
import { type Editor } from '@slugcat-dev/mark-ed'

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
			if (a.pos.y !== b.pos.y)
				return a.pos.y - b.pos.y

			return a.pos.x - b.pos.x
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
export async function pasteOnCanvas(dataTransfer: DataTransfer | null, pos: Pos) {
	if (!dataTransfer)
		return { type: null, cards: [] }

	const files = Array.from(dataTransfer.files)
	const images = files.filter(file => file.type.startsWith('image'))
	const items = await getDataTransferItems(dataTransfer)
	const cardsItem = items.find(item => item.type === 'cards')
	const textItem = items.find(item => item.type === 'text/plain')
	const vscodeItem = items.find(item => item.type === 'vscode-editor-data')

	// Paste images
	if (images.length) {
		let offset = 0

		return {
			type: 'image',
			cards: await Promise.all(images.map(image => new Promise<Card>(async resolve => {
				const data = await fileToBase64(image)

				resolve(createCard({
					id: Date.now() + Math.random(),
					type: 'image',
					pos: {
						x: pos.x + offset,
						y: pos.y + offset
					},
					content: data
				}))

				offset += 20
			})))
		}
	}

	// Paste copied cards
	if (cardsItem) {
		try {
			const cards = JSON.parse(cardsItem.data) as Card[]

			if (cards.length) {
				const corner = cards[0].pos

				return {
					type: 'card',
					cards: cards.map((card, i) => createCard({
						id: Date.now() + i,
						type: card.type,
						pos: {
							x: pos.x + card.pos.x - corner.x,
							y: pos.y + card.pos.y - corner.y
						},
						content: card.content
					}))
				}
			}
		} catch {}
	}

	// Paste text
	if (textItem) {
		let text = textItem.data

		// Test if the pasted text is an image URL
		if (/^https?:\/\//.test(text) && isURL(text)) {
			try {
				await loadImage(text)

				return {
					type: 'image',
					cards: [createCard({
						id: Date.now(),
						type: 'image',
						pos,
						content: text
					})]
				}
			} catch {}
		}

		// If the text was copied from Visual Studio Code, paste it as fenced code block
		if (vscodeItem) {
			try {
				const mode = JSON.parse(vscodeItem.data).mode as string
				const fence = '```'

				if (mode !== 'plaintext' && mode !== 'markdown')
					text = `${fence}${mode}\n${text}\n${fence}`
			} catch {}
		}

		return {
			type: vscodeItem ? 'code' : 'text',
			cards: [createCard({
				id: Date.now(),
				type: 'text',
				pos,
				content: text
			})]
		}
	}

	console.log(items)

	return { type: null, cards: [] }
}

export async function getDataTransferItems(dataTransfer: DataTransfer) {
	const items = Array.from(dataTransfer.items)
		.filter(item => item.kind !== 'file')
		.map(async item => ({ type: item.type, data: await getAsString(item) }))

	return Promise.all(items)
}

function getAsString(item: DataTransferItem) {
	return new Promise<string>(resolve => item.getAsString(resolve))
}

function getAsFile(item: DataTransferItem) {
	return new Promise<File | null>(resolve => resolve(item.getAsFile()))
}
