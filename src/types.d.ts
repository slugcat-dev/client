interface Pos {
	x: number
	y: number
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

interface Keymap {
	[key: string]: (event: KeyboardEvent) => void
}

interface Canvas {
	ref: HTMLElement
	active: boolean
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

interface Card {
	id: number
	new?: boolean,
	type: 'box' | 'text' | 'image' | 'link' | 'audio' | 'video'
	pos: Pos
	content: any
	modified: number
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

interface Base64File {
	base64: string
	name: string
	type: string
}
