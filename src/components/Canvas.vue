<script setup lang="ts">
import { computed, inject, reactive, useTemplateRef, watch, type WatchHandle } from 'vue'
import { useCanvas } from '../composables/canvas'
import { createCard } from '../composables/cards'
import { distance, isTrackpad, midpoint, moveThreshold, onceChanged } from '../utils'
import Card from './Card.vue'

const { cards } = defineProps<{ cards: Card[] }>()
const canvasRef = useTemplateRef('canvas-ref')
const pointer = inject('pointer') as PointerState
const pointers = inject('pointers') as PointerState[]
const canvas = useCanvas(canvasRef, pointer, pointers)
const state = reactive({
	panning: false,
	pinching: false,
	gesture: {
		pointers: [] as PointerState[],
		initialZoom: 1,
		prevTranslate: { x: 0, y: 0 }
	}
})
const animating = computed(() => state.panning
	|| state.pinching
	|| canvas.smoothZoom !== canvas.zoom
	|| canvas.smoothScroll.x !== canvas.scroll.x
	|| canvas.smoothScroll.y !== canvas.scroll.y
)
const gridSize = computed(() => {
	// Adjust the background grid size to the zoom level
	let value = 20 * canvas.smoothZoom

	while (value <= 10) value *= 2
	while (value >= 30) value /= 2

	return value
})
let clickAllowed = false
let unwatchPointerMove: WatchHandle
let unwatchPointerUp: WatchHandle
let unwatchGestureChange: WatchHandle

function onPointerDown(event: PointerEvent) {
	// Wait until the event has bubbled to the listener on the document that updates the pointer state
	// Use one pointer to pan the canvas and two pointers for pinch-to-zoom, more than two pointers will be ignored
	onceChanged(pointers, () => {
		if (pointers.length === 1 && event.target === canvas.ref) {
			state.panning = true
			clickAllowed = document.activeElement === document.body
			unwatchPointerMove = watch(pointer, onPointerMove)
			unwatchPointerUp = watch([
				() => pointer.down,
				() => pointers.length
			], onPointerUp, { flush: 'sync' })
		} else if (pointers.length === 2) {
			state.pinching = true
			state.gesture.pointers = pointers.map(p => ({ ...p }))
			state.gesture.initialZoom = canvas.smoothZoom
			state.gesture.prevTranslate = { x: 0, y: 0 }
			clickAllowed = false
			unwatchGestureChange = watch(pointers, onGestureChange)
		}
	})
}

function onPointerMove() {
	if (!pointer.moved)
		return

	// Pan the canvas
	canvas.scroll.x += pointer.movementX
	canvas.scroll.y += pointer.movementY
	canvas.smoothScroll.x = canvas.scroll.x
	canvas.smoothScroll.y = canvas.scroll.y
}

function onPointerUp() {
	if (pointer.down && pointers.length === 1)
		return

	state.panning = false

	if (pointer.moved) {
		clickAllowed = false

		// Make scrolling feel like it has inertia on touch devices
		const velocity = { x: pointer.movementX, y: pointer.movementY }

		if (pointer.type === 'touch' && moveThreshold(velocity, { x: 0, y: 0 }, 4))
			canvas.kineticScroll(velocity)
	}

	unwatchPointerMove()
	unwatchPointerUp()
}

function onGestureChange() {
	// Only track the pointers involved in the gesture
	const activePointers = pointers.filter(p => state.gesture.pointers.some(g => g.id === p.id))

	// Continue as long as the two involved pointers are still down
	if (activePointers.length !== 2)
		return onGestureEnd()

	const origin = midpoint(state.gesture.pointers)
	const currentMidpoint = midpoint(activePointers)
	const transform = {
		scale: distance(activePointers) / distance(state.gesture.pointers),
		translate: {
			x: currentMidpoint.x - origin.x,
			y: currentMidpoint.y - origin.y
		}
	}
	const dX = transform.translate.x - state.gesture.prevTranslate.x
	const dY = transform.translate.y - state.gesture.prevTranslate.y

	// Elastic zoom
	canvas.zoomTo(state.gesture.initialZoom * transform.scale, {
		x: origin.x + transform.translate.x,
		y: origin.y + transform.translate.y
	}, true)

	// Apply transformations to the canvas
	canvas.scroll.x += dX
	canvas.scroll.y += dY
	canvas.smoothScroll.x = canvas.scroll.x
	canvas.smoothScroll.y = canvas.scroll.y
	canvas.smoothZoom = canvas.zoom
	state.gesture.prevTranslate = transform.translate
}

function onGestureEnd() {
	state.pinching = false

	// Elastic zoom bounce back
	if (canvas.zoom > 2 || canvas.zoom < .2) {
		const canvasRect = canvas.ref.getBoundingClientRect()

		canvas.zoomTo(canvas.zoom, {
			x: canvasRect.x + canvasRect.width / 2,
			y: canvasRect.y + canvasRect.height / 2
		})
		canvas.animate(300)
	}

	unwatchGestureChange()
}

function onClick(event: MouseEvent) {
	// Require doubleclick to create a card when using a mouse
	if (!clickAllowed || (pointer.type === 'mouse' && event.detail !== 2))
		return

	createCard({ pos: canvas.toCanvasPos(pointer) })
}

function onWheel(event: WheelEvent) {
	if (state.panning || state.pinching)
		return

	const isMouseWheel = !isTrackpad(event)
	let deltaX = event.deltaX
	let deltaY = event.deltaY

	// Normalize scroll speed
	if (isMouseWheel) {
		deltaX = Math.sign(deltaX) * 100
		deltaY = Math.sign(deltaY) * 100
	}

	if (event.ctrlKey || event.metaKey) {
		// Zoom the canvas
		const delta = isMouseWheel
			? Math.sign(event.deltaY) * .2
			: event.deltaY / 150

		canvas.zoomTo(canvas.zoom * (1 - delta), { x: event.clientX, y: event.clientY })

		if (isMouseWheel)
			canvas.animate()
		else {
			canvas.smoothScroll.x = canvas.scroll.x
			canvas.smoothScroll.y = canvas.scroll.y
			canvas.smoothZoom = canvas.zoom
		}
	} else {
		// Scroll horizontally when holding shift or vertically otherwise
		if (event.shiftKey && !deltaX)
			[deltaX, deltaY] = [deltaY, deltaX]

		canvas.scroll.x -= deltaX
		canvas.scroll.y -= deltaY

		if (isMouseWheel)
			canvas.animate()
		else {
			canvas.smoothScroll.x = canvas.scroll.x
			canvas.smoothScroll.y = canvas.scroll.y
		}
	}
}
</script>

<template>
	<div
		ref="canvas-ref"
		class="canvas"
		:style="{ cursor: state.panning && pointer.moved ? 'move' : 'default' }"
		@pointerdown.left="onPointerDown"
		@pointerdown.middle="onPointerDown"
		@wheel.prevent="onWheel"
		@click.left.self="onClick"
	>
		<svg class="canvas-background">
			<pattern
				id="dot-pattern"
				patternUnits="userSpaceOnUse"
				:x="canvas.smoothScroll.x"
				:y="canvas.smoothScroll.y"
				:width="gridSize"
				:height="gridSize"
			>
				<circle
					cx=".75"
					cy=".75"
					r=".75"
				/>
			</pattern>
			<rect
				x="0"
				y="0"
				width="100%"
				height="100%"
				fill="url(#dot-pattern)"
			/>
		</svg>
		<div
			class="stuff"
			:style="{
				translate: `${canvas.smoothScroll.x}px ${canvas.smoothScroll.y}px`,
				scale: canvas.smoothZoom,
				willChange: animating ? 'transform' : 'auto'
			}"
		>
			<Card
				v-for="card of cards"
				:key="card.id"
				:card
				:canvas
			/>
		</div>
	</div>
</template>

<style>
.canvas {
	position: relative;
	overflow: clip;
	user-select: none;
	touch-action: none;

	top: 24px;
	left: 48px;
	width: calc(100vw - 48px);
	height: calc(100vh - 24px);
	outline: 1px solid #363636;

	.canvas-background {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;

		circle {
			fill: #363636;
		}
	}

	.stuff {
		position: absolute;
	}
}
</style>
