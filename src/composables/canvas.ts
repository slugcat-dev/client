import { reactive, type ShallowRef } from 'vue'

export function useCanvas(ref: ShallowRef<HTMLDivElement | null>) {
	const canvas = reactive({
		ref,
		active: false,
		scroll: { x: 0, y: 0 },
		smoothScroll: { x: 0, y: 0 },
		zoom: 1,
		smoothZoom: 1
	})

	function toCanvasPos(pos: Pos, smooth = true) {
		const scroll = smooth ? canvas.smoothScroll : canvas.scroll
		const zoom = smooth ? canvas.smoothZoom : canvas.zoom
		const canvasRect = canvas.ref!.getBoundingClientRect()

		return {
			x: (pos.x - scroll.x - canvasRect.left) / zoom,
			y: (pos.y - scroll.y - canvasRect.top) / zoom
		}
	}

	function toCanvasRect(rect: DOMRect, smooth = true) {
		const topLeft = toCanvasPos(rect, smooth)
		const bottomRight = toCanvasPos({ x: rect.x + rect.width, y: rect.y + rect.height }, smooth)

		return new DOMRect(
			topLeft.x,
			topLeft.y,
			bottomRight.x - topLeft.x,
			bottomRight.y - topLeft.y
		)
	}

	function zoomTo(zoom: number, adjust: Pos, elastic = false) {
		const prevPos = toCanvasPos(adjust, false)

		if (elastic) {
			if (zoom > 2)
				zoom = 2 + Math.log(zoom - 1)
			if (zoom < .2)
				zoom = (zoom / 0.2) ** Math.E * 0.1 + 0.1
		} else
			zoom = Math.max(Math.min(zoom, 2), .2)

		canvas.zoom = zoom

		const pos = toCanvasPos(adjust, false)
		const dX = (prevPos.x - pos.x) * canvas.zoom
		const dY = (prevPos.y - pos.y) * canvas.zoom

		canvas.scroll.x -= dX
		canvas.scroll.y -= dY
	}

	function animate() {
		canvas.smoothScroll.x = canvas.scroll.x
		canvas.smoothScroll.y = canvas.scroll.y
		canvas.smoothZoom = canvas.zoom
	}

	return Object.assign(canvas, {
		toCanvasPos,
		toCanvasRect,
		zoomTo,
		animate
	}) as Canvas
}
