<script setup lang="ts">
import { computed, inject, reactive, useTemplateRef, watch, type WatchHandle } from 'vue'
import { useCanvas } from '../composables/canvas'
import { createCard } from '../composables/cards'
import { isTrackpad } from '../utils'
import Card from './Card.vue'

const { cards } = defineProps<{ cards: Card[] }>()
const canvasRef = useTemplateRef('canvas-ref')
const canvas = useCanvas(canvasRef)
const state = reactive({ panning: false })
const pointer = inject<PointerState>('pointer')!
const pointers = inject<PointerState[]>('pointers')!
const animating = computed(() => state.panning
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

function onPointerDown() {
	if (pointer.down)
		return

	state.panning = true
	clickAllowed = document.activeElement === document.body

	// Add watchers after the event has bubbled to the listener that updates the pointer state
	watch(pointer, () => {
		unwatchPointerMove = watch(pointer, onPointerMove)
		unwatchPointerUp = watch([
			() => pointer.down,
			() => pointers.length
		], onPointerUp, { flush: 'sync' })
	}, { once: true })
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

	if (pointer.moved)
		clickAllowed = false

	unwatchPointerMove()
	unwatchPointerUp()
}

function onClick(event: MouseEvent) {
	// Require doubleclick to create a card when using a mouse
	if (!clickAllowed || (pointer.type === 'mouse' && event.detail !== 2))
		return

	createCard({ pos: canvas.toCanvasPos(pointer) })
}

function onWheel(event: WheelEvent) {
	if (state.panning)
		return

	const isMouseWheel = !isTrackpad(event)
	let deltaX = event.deltaX
	let deltaY = event.deltaY

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

		@pointerdown.left.self="onPointerDown"
		@pointerdown.middle.self="onPointerDown"
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
