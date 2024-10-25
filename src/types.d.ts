interface Pos {
	x: number
	y: number
}

interface PointerStateBase extends Pos {
	movementX: number
	movementY: number
	type: string
	id: number
}

interface PointerUpState extends PointerStateBase {
	down: false
	moved: false
}

interface PointerDownState extends PointerStateBase {
	down: Pos
	moved: boolean
}

type PointerState = PointerUpState | PointerDownState

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
	animate: () => void
}

interface Card {
	id: 'new' | number
	pos: Pos
	content: string
}
