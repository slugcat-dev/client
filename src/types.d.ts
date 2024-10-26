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

interface Canvas {
	ref: HTMLElement
	active: boolean
	scroll: Pos
	smoothScroll: Pos
	zoom: number
	smoothZoom: number
	toCanvasPos: (pos: Pos, smooth?: boolean) => Pos
	toCanvasRect: (rect: DOMRect, smooth?: boolean) => DOMRect
	zoomTo: (zoom: number, adjust: Pos, elastic?: boolean) => void
	animate: (duration?: number) => void
	kineticScroll: (velocity: Pos, pointer: PointerState) => void
}

interface Card {
	id: 'new' | number
	pos: Pos
	content: string
}
