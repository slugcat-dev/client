interface Pos {
	x: number
	y: number
}

interface User {
	id: string
	email: string
	created: number
}

interface Board {
	id: string
	owner: string
	name: string
	cards: Card[]
	modified: number
	created: number
}

interface Card {
	id: string
	type: 'box' | 'text' | 'image' | 'link' | 'audio' | 'video'
	new?: boolean,
	pos: Pos
	content: any
	created: number
	modified: number
}

interface Queue {
	boards: {
		type: 'create' | 'update' | 'delete'
		board: Partial<Board>
	}[]
	cards: {
		type: 'create' | 'update' | 'delete'
		board: string
		card: Partial<Card>
	}[]
}

interface PointerState extends Pos {
	id: number
	down: Pos | false
	moved: boolean
	movementX: number
	movementY: number
	type: string
	ctrlKey: boolean
	metaKey: boolean
	shiftKey: boolean
	altKey: boolean
}

interface BoardContext {
	available: boolean
	board: Board
	cards: Card[]
	createCard: (data: Partial<Card>) => Card
	updateCard: (card: Card, create?: boolean) => void
	updateMany: (cards: Card[]) => void
	deleteCard: (card: Card) => void
	deleteMany: (cards: Card[]) => void
}

interface CanvasContext {
	ref: HTMLElement
	scroll: Pos
	smoothScroll: Pos
	scrollSpeed: Pos
	zoom: number
	smoothZoom: number
	gridSize: number
	anyArrowKey: boolean
	toCanvasPos: (pos: Pos, smooth?: boolean) => Pos
	toCanvasRect: (rect: DOMRect, smooth?: boolean) => DOMRect
	getCardRect: (card: Card) => DOMRect
	getCardRects: (cards?: Card[]) => DOMRect | undefined
	zoomTo: (zoom: number, adjust: Pos, elastic?: boolean) => void
	home: () => void
	overview: () => void
	animate: (duration?: number) => void
	kineticScroll: (velocity: Pos) => void
	edgeScroll: () => void
	stopEdgeScroll: () => void
}

interface CanvasSelection {
	cards: Card[]
	box: DOMRect | null
	boxVisible: boolean
	draw: boolean
	clear: () => void
}

interface Toast {
	id: number
	message: string
	color: 'red' | 'yellow' | 'green'
	persistent: boolean
	timeout: ReturnType<typeof setTimeout>
}

interface Keymap {
	[key: string]: (event: KeyboardEvent) => void
}

interface Base64File {
	base64: string
	name: string
	type: string
}
