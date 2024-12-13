import { useAppState } from './appState'
import { useStorage } from './storage'
import { useGateway } from './gateway'
import { type RouteLocation } from 'vue-router'
import { computed, reactive, watch } from 'vue'
import { reactiveComputed, tryOnScopeDispose } from '@vueuse/core'
import { clone, logBadge, nanoid } from '../utils'
import { FetchError, ofetch } from 'ofetch'

const apiURL = import.meta.env.APP_API_URL
const appState = useAppState()
const storage = await useStorage()
const { gateway, onMessage, cleanupOnMessage } = useGateway()

export async function useBoard(route: RouteLocation) {
	const id = route.params.board as string
	const available = computed(() => storage.boards.some(board => board.id === id))
	const board = reactiveComputed(() => storage.boards.find(board => board.id === id) ?? {} as Board)
	const cards = reactive([] as Card[])
	const isCached = available.value

	if (!isCached) {
		console.warn('%cSTORAGE', logBadge('#d2a8ff'), 'Board not cached, trying to fetch')

		if (appState.loggedIn && appState.online) {
			try {
				await fetchBoard(id)
			} catch {}
		}
	}

	watch([() => appState.loggedIn && appState.online, gateway.connected], () => {
		if (appState.loggedIn && appState.online && gateway.connected.value)
			fetchBoard(id)
	}, { immediate: isCached })

	watch(() => board.cards, () => {
		if (!board.cards)
			return

		const boardCardMap = new Map(board.cards.map(card => [card.id, card]))

		for (let i = cards.length - 1; i >= 0; i--) {
			const card = cards[i]

			if (card.new)
				continue

			if (boardCardMap.has(card.id)) {
				Object.assign(card, clone(boardCardMap.get(card.id)))
				boardCardMap.delete(card.id)
			} else
				cards.splice(i, 1)
		}

		boardCardMap.forEach(card => cards.push(clone(card)))
	}, { immediate: true })

	watch(() => cards.map(card => card.new), () => {
		if (cards.some(card => card.new))
			appState.pendingWork.add('new-cards')
		else
			appState.pendingWork.delete('new-cards')
	}, { immediate: true })

	watch(gateway.connected, () => {
		if (gateway.connected.value) {
			console.log('%cGATEWAY', logBadge('#7ee787'), 'Joining', { id: board.id })
			gateway.send({
				type: 'userJoinBoard',
				board: board.id
			})
		}
	}, { immediate: true })

	onMessage(handleGatewayMessage)

	tryOnScopeDispose(() => {
		gateway.send({ type: 'userLeaveBoard' })
		cleanupOnMessage(handleGatewayMessage)
	})

	// Create a card
	function createCard(data: Partial<Card>) {
		const card = {
			id: nanoid(),
			type: 'text' as Card['type'],
			pos: { x: 0, y: 0 },
			content: { text: '' },
			created: Date.now(),
			modified: Date.now(),
			...data
		}

		if (!card.new) {
			board.cards.push(clone(card))
			storage.queue.cards.push({
				type: 'create',
				board: board.id,
				card
			})
			gateway.send({
				type: 'createCard',
				board: board.id,
				card
			})
		}

		return cards[cards.push(card) - 1]
	}

	// Update a card or create it
	function updateCard(card: Card, create = false) {
		const now = Date.now()

		if (create) {
			delete card.new

			board.cards.push(clone(card))
			storage.queue.cards.push({
				type: 'create',
				board: board.id,
				card
			})
			gateway.send({
				type: 'createCard',
				board: board.id,
				card
			})
		} else {
			card.modified = now

			if (!card.new) {
				const update = {
					id: card.id,
					pos: card.pos,
					content: card.content,
					modified: card.modified
				}

				board.cards[board.cards.findIndex(c => c.id === card.id)] = clone(card)
				storage.queue.cards.push({
					type: 'update',
					board: board.id,
					card: update
				})
				gateway.send({
					type: 'updateCards',
					board: board.id,
					cards: [update]
				})
			}
		}
	}

	// Batch update cards
	function updateMany(cards: Card[]) {
		const now = Date.now()

		cards.sort((a, b) => a.modified - b.modified).forEach((card, i) => card.modified = now + i)
		cards.filter(card => !card.new).forEach(card => {
			board.cards[board.cards.findIndex(c => c.id === card.id)] = clone(card)
			storage.queue.cards.push({
				type: 'update',
				board: board.id,
				card: {
					id: card.id,
					pos: card.pos,
					modified: card.modified
				}
			})
		})
		gateway.send({
			type: 'updateCards',
			board: board.id,
			cards: cards.filter(card => !card.new).map(card => ({
				id: card.id,
				pos: card.pos,
				modified: card.modified
			}))
		})
	}

	// Delete a card
	function deleteCard(card: Card) {
		if (!card.new) {
			board.cards.splice(board.cards.findIndex(c => c.id === card.id), 1)
			storage.queue.cards.push({
				type: 'delete',
				board: board.id,
				card: {
					id: card.id,
					modified: Date.now()
				}
			})
			gateway.send({
				type: 'deleteCard',
				board: board.id,
				card: { id: card.id }
			})
		}

		cards.splice(cards.findIndex(c => c.id === card.id), 1)
	}

	// Batch delete cards
	function deleteMany(cardsToDelte: Card[]) {
		cardsToDelte.forEach(deleteCard)
	}

	function handleGatewayMessage(data: any) {
		switch (data.type) {
			case 'createCard': {
				cards.push(data.card)
				board.cards.push(data.card)

				break
			}

			case 'updateCards': {
				data.cards.forEach((card: Partial<Card>) => {
					const cardIndex = cards.findIndex(c => c.id === card.id)
					const boardCardIndex = board.cards.findIndex(c => c.id === card.id)

					if (cardIndex !== -1) {
						cards[cardIndex].content = card.content ?? cards[cardIndex].content
						cards[cardIndex].pos = card.pos ?? cards[cardIndex].pos
						cards[cardIndex].modified = card.modified ?? cards[cardIndex].modified
					}

					if (boardCardIndex !== -1) {
						board.cards[boardCardIndex].content = card.content ?? board.cards[cardIndex].content
						board.cards[boardCardIndex].pos = card.pos ?? board.cards[boardCardIndex].pos
						board.cards[boardCardIndex].modified = card.modified ?? board.cards[boardCardIndex].modified
					}
				})

				break
			}

			case 'deleteCard': {
				const cardIndex = cards.findIndex(c => c.id === data.card.id)
				const boardCardIndex = board.cards.findIndex(c => c.id === data.card.id)

				if (cardIndex !== -1)
					cards.splice(cardIndex, 1)

				if (boardCardIndex !== -1)
					board.cards.splice(boardCardIndex, 1)

				break
			}
		}
	}

	return {
		available,
		board,
		cards,
		createCard,
		updateCard,
		updateMany,
		deleteCard,
		deleteMany
	}
}

/**
 * Create a new board.
 */
export function createBoard() {
	const board = {
		id: nanoid(),
		owner: storage.user?.id ?? 'guest',
		name: 'New Board',
		cards: [],
		created: Date.now(),
		modified: Date.now()
	}

	storage.boards.push(board)
	storage.queue.boards.push({
		type: 'create',
		board: {
			id: board.id,
			name: board.name,
			created: board.created,
			modified: board.modified
		}
	})

	return board.id
}

/**
 * Update a board.
 */
export function updateBoard(board: Board) {
	storage.queue.boards.push({
		type: 'update',
		board: {
			id: board.id,
			name: board.name,
			modified: board.modified
		}
	})
}

/**
 * Delete a board.
 */
export function deleteBoard(board: Board) {
	storage.boards.splice(storage.boards.findIndex(b => b.id === board.id), 1)
	storage.queue.boards.push({
		type: 'delete',
		board: { id: board.id }
	})
}

/**
 * Fetch all boards, cards excluded.
 */
export async function fetchBoards() {
	await queueSynced()

	console.log('%cSYNC', logBadge('#79c0ff'), 'Fetching board list...')

	const boards = await ofetch<Omit<Board, 'cards'>[]>(`${apiURL}/user/me/boards`, {
		headers: {
			'Authorization': `Bearer ${storage.token}`
		}
	})

	storage.boards.splice(0, storage.boards.length, ...boards.map(board => {
		const storedBoard = storage.boards.find(b => b.id === board.id)

		return {
			...board,
			created: new Date(board.created).getTime(),
			modified: new Date(board.modified).getTime(),
			cards: storedBoard ? storedBoard.cards : []
		}
	}))
}

/**
 * Fetch one board, cards included.
 */
export async function fetchBoard(id: string) {
	await queueSynced()

	console.log('%cSYNC', logBadge('#79c0ff'), `Fetching board`, { id })

	try {
		const boardData = await ofetch<Board>(`${apiURL}/board/${id}`, {
			headers: {
				'Authorization': `Bearer ${storage.token}`
			}
		})
		const board = {
			...boardData,
			created: new Date(boardData.created).getTime(),
			modified: new Date(boardData.modified).getTime(),
			cards: boardData.cards.map(card => ({
				...card,
				created: new Date(card.created).getTime(),
				modified: new Date(card.modified).getTime()
			}))
		}
		const boardIndex = storage.boards.findIndex(b => b.id === id)

		if (boardIndex !== -1)
			storage.boards.splice(boardIndex, 1, board)
		else
			storage.boards.push(board)
	} catch (err) {
		if (err instanceof FetchError && err.response?.status === 404) {
			console.warn('%cSYNC', logBadge('#79c0ff'), 'Board not found', { id })

			const boardIndex = storage.boards.findIndex(b => b.id === id)

			if (boardIndex !== -1)
				storage.boards.splice(boardIndex, 1)
		} else
			throw err
	}
}

function queueSynced() {
	return new Promise<void>(resolve => {
		const queueEmpty = () => storage.queue.boards.length + storage.queue.cards.length === 0

		watch(queueEmpty, () => {
			resolve()
		}, { once: true, immediate: queueEmpty() })
	})
}
