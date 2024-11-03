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
	anyArrowKey: boolean
	toCanvasPos: (pos: Pos, smooth?: boolean) => Pos
	toCanvasRect: (rect: DOMRect, smooth?: boolean) => DOMRect
	zoomTo: (zoom: number, adjust: Pos, elastic?: boolean) => void
	home: () => void
	overview: () => void
	animate: (duration?: number) => void
	kineticScroll: (velocity: Pos) => void
	edgeScroll: () => void
	stopEdgeScroll: () => void
}

interface Card {
	id: 'new' | number
	type: 'text' | 'image'
	pos: Pos
	content: string
}

interface CanvasSelection {
	rect: DOMRect | null
	cards: Card[]
	rectVisible: boolean
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
