import { reactive, watch, type ShallowRef } from 'vue'
import { clamp, prefersReducedMotion } from '../utils'

export function useCanvas(ref: ShallowRef<HTMLDivElement | null>, pointer: PointerState, pointers: PointerState[]) {
	const canvas = reactive({
		ref,
		active: false,
		scroll: { x: 0, y: 0 },
		smoothScroll: { x: 0, y: 0 },
		scrollSpeed: { x: 0, y: 0 },
		zoom: 1,
		smoothZoom: 1,
		anyArrowKey: false
	})
	const animation = {
		scrolling: false,
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

	watch(() => canvas.scrollSpeed, () => {
		if (animation.scrolling)
			return

		animation.scrolling = true

		let prevTimestamp = Infinity

		function scrollStep(timestamp: number) {
			const delta = Math.max(timestamp - prevTimestamp, 0)
			const speedX = Math.abs(canvas.scrollSpeed.x)
			const speedY = Math.abs(canvas.scrollSpeed.y)

			// Normalize the scroll speed so scrolling diagonally doesn't feel faster
			const magnitude = Math.hypot(speedX, speedY)

			if (!magnitude)
				return animation.scrolling = false

			const scrollX = (canvas.scrollSpeed.x * delta / magnitude) * speedX
			const scrollY = (canvas.scrollSpeed.y * delta / magnitude) * speedY

			canvas.scroll.x += scrollX
			canvas.scroll.y += scrollY

			animate()
			requestAnimationFrame(scrollStep)

			prevTimestamp = timestamp
		}

		requestAnimationFrame(scrollStep)
	}, { deep: true })

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

	// Zoom and adjust scroll to the pointer position
	function zoomTo(zoom: number, adjust: Pos, elastic = false) {
		const prevPos = toCanvasPos(adjust, false)

		if (elastic) {
			if (zoom > 2)
				zoom = 2 + Math.log(zoom - 1)
			if (zoom < .2)
				zoom = (zoom / 0.2) ** Math.E * 0.1 + 0.1
		} else
			zoom = clamp(zoom, .2, 2)

		canvas.zoom = zoom

		const pos = toCanvasPos(adjust, false)
		const dX = (prevPos.x - pos.x) * canvas.zoom
		const dY = (prevPos.y - pos.y) * canvas.zoom

		canvas.scroll.x -= dX
		canvas.scroll.y -= dY
	}

	function home() {
		canvas.scroll.x = 0
		canvas.scroll.y = 0
		canvas.zoom = 1

		animate(500)
	}

	// Zoom out to fit all cards into view
	function overview() {
		const canvasRect = canvas.ref!.getBoundingClientRect()
		const cardRefs = Array.from(canvas.ref!.querySelectorAll('.card'))

		const rect = cardRefs.reduce<DOMRect | undefined>((rect, cardRef) => {
			const cardRect = toCanvasRect(cardRef.getBoundingClientRect(), false)

			if (!rect)
				return cardRect

			const minX = Math.min(rect.x, cardRect.x)
			const minY = Math.min(rect.y, cardRect.y)
			const maxX = Math.max(rect.x + rect.width, cardRect.x + cardRect.width)
			const maxY = Math.max(rect.y + rect.height, cardRect.y + cardRect.height)

			return new DOMRect(minX, minY, maxX - minX, maxY - minY)
		}, undefined)

		if (!rect)
			return home()

		const scaleX = canvasRect.width / (rect.width + 100)
		const scaleY = canvasRect.height / (rect.height + 100)

		canvas.zoom = clamp(Math.min(scaleX, scaleY), .2, 1)
		canvas.scroll.x = (canvasRect.width - rect.width * canvas.zoom) / 2 - rect.x * canvas.zoom
		canvas.scroll.y = (canvasRect.height - rect.height * canvas.zoom) / 2 - rect.y * canvas.zoom

		animate(500)
	}

	function animate(duration = 200) {
		if (prefersReducedMotion) {
			canvas.smoothScroll.x = canvas.scroll.x
			canvas.smoothScroll.y = canvas.scroll.y
			canvas.smoothZoom = canvas.zoom

			return
		}

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
			const progress = clamp(elapsedTime / duration, 0, 1)
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

	// Make scrolling feel like it has inertia
	function kineticScroll(velocity: Pos) {
		if (pointers.length || prefersReducedMotion)
			return

		let prevTimestamp = Infinity

		function kineticScrollStep(timestamp: number) {
			const delta = Math.max(timestamp - prevTimestamp, 0) / (1000 / 60)

			canvas.scroll.x += velocity.x * delta
			canvas.scroll.y += velocity.y * delta
			canvas.smoothScroll.x = canvas.scroll.x
			canvas.smoothScroll.y = canvas.scroll.y
			velocity.x *= 0.95 ** delta
			velocity.y *= 0.95 ** delta

			if ((Math.abs(velocity.x) > .25 || Math.abs(velocity.y) > .25) && !pointer.down)
				requestAnimationFrame(kineticScrollStep)

			prevTimestamp = timestamp
		}

		requestAnimationFrame(kineticScrollStep)
	}

	// Scroll the canvas depending on how close the pointer is to the edge of the canvas
	function edgeScroll() {
		if (canvas.anyArrowKey)
			return

		const canvasRect = canvas.ref!.getBoundingClientRect()
		const threshold = canvasRect.width < 600 ? 50 : 100
		const left = pointer.x - canvasRect.left
		const right = canvasRect.right - pointer.x
		const top = pointer.y - canvasRect.top
		const bottom = canvasRect.bottom - pointer.y

		canvas.scrollSpeed.x = clamp((left < threshold ? threshold - left : right < threshold ? -(threshold - right) : 0) / threshold, -1, 1)
		canvas.scrollSpeed.y = clamp((top < threshold ? threshold - top : bottom < threshold ? -(threshold - bottom) : 0) / threshold, -1, 1)
	}

	function stopEdgeScroll() {
		if (!canvas.anyArrowKey) {
			canvas.scrollSpeed.x = 0
			canvas.scrollSpeed.y = 0
		}
	}

	return Object.assign(canvas, {
		toCanvasPos,
		toCanvasRect,
		zoomTo,
		home,
		overview,
		animate,
		kineticScroll,
		edgeScroll,
		stopEdgeScroll
	}) as Canvas
}
