import { useAppState } from './composables/appState'
import { useToaster } from './composables/toaster'
import { limitSize, isURL, nanoid } from './utils'
import { ofetch } from 'ofetch'

const apiURL = import.meta.env.APP_API_URL
const appState = useAppState()
const { toast } = useToaster()

/**
 * Copy the given cards to the clipboard.
 */
export function copyCards(cards: Card[]) {
	// The clipboard API doesn't support custom types, so we do some trickery
	document.addEventListener('copy', (event) => {
		if (!event.clipboardData)
			return

		// Sort cards in reading order
		cards = cards.sort((a, b) => {
			if (a.pos.y !== b.pos.y)
				return a.pos.y - b.pos.y

			return a.pos.x - b.pos.x
		}).filter(card => !card.new)

		event.preventDefault()
		event.clipboardData.setData('text/plain', (() => cards.map(getCardText).join('\n\n'))())
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

	const files = Array.from(dataTransfer.files).filter(({ type }) => /image|audio|video/.test(type))
	const items = await getDataTransferItems(dataTransfer)
	const cardsItem = items.find(item => item.type === 'cards')
	const textItem = items.find(item => item.type === 'text/plain')
	const vscodeItem = items.find(item => item.type === 'vscode-editor-data')

	// Paste copied cards
	if (cardsItem) {
		try {
			const cards = JSON.parse(cardsItem.data) as Card[]

			if (cards.length) {
				const now = Date.now()
				const corner = cards[0].pos

				return {
					type: 'card',
					cards: cards.map((card, i) => ({
						id: nanoid(),
						type: card.type,
						pos: {
							x: pos.x + card.pos.x - corner.x,
							y: pos.y + card.pos.y - corner.y
						},
						content: card.content,
						modified: now + i
					}))
				}
			}
		} catch {}
	}

	// Paste files
	if (files.length) {
		if (!appState.loggedIn) {
			return {
				type: null,
				cards: [],
				error: 'You need to be logged in to upload files'
			}
		}

		if (!appState.online) {
			return {
				type: null,
				cards: [],
				error: 'Can\'t upload files while offline'
			}
		}

		const now = Date.now()
		const cards = files
			.filter(file => {
				if (file.size > 1024 ** 3)
					toast(`"${file.name}" is too large to upload`, 'red')

				return file.size < 1024 ** 3
			})
			.map((file, i) => {
				const type = file.type.split('/')[0] as Card['type']

				return {
					id: nanoid(),
					new: true,
					type,
					pos: {
						x: pos.x + i * 20,
						y: pos.y + i * 20
					},
					content: { file },
					modified: now + i
				}
			})
		const type = new Set(cards.map(({ type }) => type)).size > 1 ? 'file' : cards[0]?.type

		return { type, cards }
	}

	// Paste text
	if (textItem) {
		let text = textItem.data

		// Test if the pasted text is a link
		if (/^https?:\/\//.test(text) && isURL(text) && appState.online) {
			try {
				const data = await ofetch(`${apiURL}/link-type?url=${encodeURIComponent(text)}`)
				const content = (() => {
					switch (data.type) {
						case 'image': {
							const [width, height] = limitSize(data.width, data.height, 40, 240)

							return {
								src: text,
								width,
								height
							}
						}
						case 'audio': return { src: text, title: data.title }
						case 'link': return { url: text }
						default: return { src: text }
					}
				})()

				return {
					type: data.type,
					cards: [{
						type: data.type,
						new: data.type === 'link',
						pos,
						content
					}]
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
			cards: [{
				type: 'text',
				pos,
				content: { text }
			}]
		}
	}

	console.log(items)

	return {
		type: null,
		cards: [],
		error: 'Type not supported'
	}
}

export async function getDataTransferItems(dataTransfer: DataTransfer) {
	const items = Array.from(dataTransfer.items)
		.filter(item => item.kind !== 'file')
		.map(async item => ({ type: item.type, data: await getAsString(item) }))

	return Promise.all(items)
}

function getCardText(card: Card) {
	switch (card.type) {
		case 'box': return card.content.label
		case 'text': return card.content.text
		case 'audio':
		case 'video':
		case 'image': return card.content.src
		case 'link': return card.content.url
	}
}

function getAsString(item: DataTransferItem) {
	return new Promise<string>(resolve => item.getAsString(resolve))
}

function getAsFile(item: DataTransferItem) {
	return new Promise<File | null>(resolve => resolve(item.getAsFile()))
}
