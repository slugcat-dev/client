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
	const animation = {
		lock: false,
		start: {
			time: 0,
			scroll: { x: 0, y: 0 },
			zoom: 1
		},
		delta: {
			scroll: { x: 0, y: 0 },
			zoom: 0
		}
	}

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

	function animate(duration = 200) {
		animation.start.time = performance.now()
		animation.start.scroll.x = canvas.smoothScroll.x
		animation.start.scroll.y = canvas.smoothScroll.y
		animation.start.zoom = canvas.smoothZoom
		animation.delta.scroll.x = canvas.scroll.x - canvas.smoothScroll.x
		animation.delta.scroll.y = canvas.scroll.y - canvas.smoothScroll.y
		animation.delta.zoom = canvas.zoom - canvas.smoothZoom

		if (animation.lock)
			return

		animation.lock = true

		function animationStep(timestamp: number) {
			const elapsedTime = timestamp - animation.start.time
			const progress = Math.max(Math.min(elapsedTime / duration, 1), 0)
			const ease = (t: number) => (--t) * t * t + 1

			canvas.smoothScroll.x = animation.start.scroll.x + animation.delta.scroll.x * ease(progress)
			canvas.smoothScroll.y = animation.start.scroll.y + animation.delta.scroll.y * ease(progress)
			canvas.smoothZoom = animation.start.zoom + animation.delta.zoom * ease(progress)

			if (elapsedTime < duration)
				requestAnimationFrame(animationStep)
			else
				animation.lock = false
		}

		requestAnimationFrame(animationStep)
	}

	return Object.assign(canvas, {
		toCanvasPos,
		toCanvasRect,
		zoomTo,
		animate
	}) as Canvas
}
