import { useAppState } from './appState'
import { useStorage } from './storage'
import { type RouteLocation } from 'vue-router'
import { reactiveComputed } from '@vueuse/core'
import { reactive, watch } from 'vue'
import { clone, logBadge, nanoid } from '../utils'
import { ofetch } from 'ofetch'

const apiURL = import.meta.env.APP_API_URL
const appState = useAppState()
const storage = await useStorage()

export async function useBoard(route: RouteLocation) {
	const id = route.params.board as string
	const storedBoard = storage.boards.find(board => board.id === id)
	const board = reactiveComputed(() => storage.boards.find(b => b.id === id) ?? {} as Board)
	const cards = reactive([] as Card[])

	if (!storedBoard) {
		console.debug('Board not cached, trying to fetch...')

		try {
			if (appState.loggedIn && appState.online)
				await fetchBoard(id)
			else
				return undefined
		} catch {
			return undefined
		}
	}

	watch(() => appState.loggedIn && appState.online, () => {
		console.debug('online watcher')

		if (appState.loggedIn && appState.online)
			fetchBoard(id)
	}, { immediate: !!storedBoard })

	watch(() => board.cards, () => {
		console.debug('card watcher')
		cards.splice(0, cards.length, ...board.cards.map(card => clone(card)))
	}, { immediate: true })

	watch(() => cards.map(card => card.new), () => {
		if (cards.some(card => card.new))
			appState.pendingWork.add('new-cards')
		else
			appState.pendingWork.delete('new-cards')
	}, { immediate: true })

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
				card: {
					id: card.id,
					type: card.type,
					pos: card.pos,
					content: card.content,
					created: card.created,
					modified: card.modified
				}
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
				card: {
					id: card.id,
					type: card.type,
					pos: card.pos,
					content: card.content,
					created: card.created,
					modified: card.modified
				}
			})
		} else {
			card.modified = now

			if (!card.new) {
				board.cards[board.cards.findIndex(c => c.id === card.id)] = clone(card)
				storage.queue.cards.push({
					type: 'update',
					board: board.id,
					card: {
						id: card.id,
						pos: card.pos,
						content: card.content,
						modified: card.modified
					}
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
					content: card.content,
					modified: card.modified
				}
			})
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
		}

		cards.splice(cards.findIndex(c => c.id === card.id), 1)
	}

	// Batch delete cards
	function deleteMany(cardsToDelte: Card[]) {
		cardsToDelte.forEach(deleteCard)
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
	console.log('%cSYNC', logBadge('#79c0ff'), `Fetching board`, { id })

	const boardData = await ofetch<Board>(`${apiURL}/board/${id}`, {
		headers: {
			'Authorization': `Bearer ${storage.token}`
		}
	})
	const boardIndex = storage.boards.findIndex(b => b.id === boardData.id)
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

	if (boardIndex !== -1) {
		storage.boards.splice(boardIndex, 1, board)
	} else {
		storage.boards.push(board)
	}
}
