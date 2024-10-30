<script setup lang="ts">
import { computed, inject, reactive, useTemplateRef, watch, type WatchHandle } from 'vue'
import { useCanvas } from '../composables/canvas'
import { useArrowKeys, useKeymap } from '../composables/keys'
import { useEventListener } from '@vueuse/core'
import { distance, isTrackpad, midpoint, moveThreshold, onceChanged, usingInput } from '../utils'
import { createCard, deleteMany } from '../composables/cards'
import { copyCards, pasteOnCanvas } from '../clipboard'
import Card from './Card.vue'

const { cards } = defineProps<{ cards: Card[] }>()
const canvasRef = useTemplateRef('canvas-ref')
const state = reactive({
	selecing: false,
	panning: false,
	pinching: false,
	pointerOver: false,
	gesture: {
		pointers: [] as PointerState[],
		initialZoom: 1,
		prevTranslate: { x: 0, y: 0 }
	}
})
const pointer = inject('pointer') as PointerState
const pointers = inject('pointers') as PointerState[]
const canvas = useCanvas(canvasRef, pointer, pointers)
const arrowKeys = useArrowKeys()
const selection = reactive<CanvasSelection>({
	rect: null,
	cards: [],
	visible: false,
	clear() {
		selection.rect = null
		selection.cards = []
	}
})
const cursor = computed(() => {
	if (state.panning && pointer.moved)
		return 'move'
	else if (state.selecing)
		return 'crosshair'

	return 'default'
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
const selectionStyle = computed(() => {
	const rect = selection.rect ?? new DOMRect()
	const translateX = canvas.smoothScroll.x + rect.left * canvas.smoothZoom
	const translateY = canvas.smoothScroll.y + rect.top * canvas.smoothZoom

	return {
		width: `${Math.abs(rect.width) * canvas.smoothZoom}px`,
		height: `${Math.abs(rect.height) * canvas.smoothZoom}px`,
		translate: `${translateX}px ${translateY}px`,
		opacity: selection.visible ? 1 : 0,
		transition: `opacity ${selection.visible ? 0 : .2}s`
	}
})
let clickAllowed = false
let unwatchCanvas: WatchHandle
let unwatchPointerMove: WatchHandle
let unwatchPointerUp: WatchHandle
let unwatchGestureChange: WatchHandle

// Clear the selection when cards are removed
watch(() => cards.length, (length, oldLength) => {
	if (oldLength > length)
		selection.clear()
})

useKeymap({
	'Home': canvas.home,
	'End': canvas.overview,
	'CtrlMeta +': keyboardZoom,
	'CtrlMeta -': keyboardZoom,
	'CtrlMeta A': () => selection.rect = new DOMRect(-Infinity, -Infinity, Infinity, Infinity),
	'CtrlMeta C': copySelectedCards,
	'CtrlMeta X': () => {
		copySelectedCards()
		deleteSelectedCards()
	},
	'Backspace': deleteSelectedCards,
	'Delete': deleteSelectedCards,
	'Escape': selection.clear
})

// Pan the canvas using the arrow keys
watch(arrowKeys, () => {
	if (state.panning)
		return

	// This is a funny way to convert booleans to numbers btw
	canvas.scrollSpeed = {
		x: +arrowKeys.left - +arrowKeys.right,
		y: +arrowKeys.up - +arrowKeys.down,
	}
	canvas.anyArrowKey = arrowKeys.left
		|| arrowKeys.right
		|| arrowKeys.up
		|| arrowKeys.down

	if (pointer.down && !pointer.moved)
		pointer.moved = true
})

// Allow typing anywhere on the canvas to create a new card
useEventListener('keydown', (event: KeyboardEvent) => {
	if (event.ctrlKey || event.metaKey || (event.key !== 'Enter' && event.key.length !== 1) || !state.pointerOver || usingInput())
		return

	event.preventDefault()

	createCard({
		id: 'new',
		pos: canvas.toCanvasPos(pointer),
		content: event.key !== ' ' && event.key !== 'Enter' ? event.key : ''
	})
})

// Add the paste listener to the document because non-input elements don't receive paste events
useEventListener('paste', onPaste)

function keyboardZoom(event: KeyboardEvent) {
	const delta = event.key === '+' ? -.2 : .2
	const canvasRect = canvas.ref.getBoundingClientRect()

	canvas.zoomTo(canvas.zoom * (1 - delta), {
		x: canvasRect.x + canvasRect.width / 2,
		y: canvasRect.y + canvasRect.height / 2
	})
	canvas.animate()
}

function copySelectedCards() {
	if (selection.cards.length)
		copyCards(selection.cards)
}

function deleteSelectedCards() {
	if (selection.cards.length)
		deleteMany(selection.cards)
}

function onPointerDown(event: PointerEvent) {
	// Wait until the event has bubbled to the listener on the document that updates the pointer state
	// Use one pointer to pan the canvas or select and two pointers for pinch-to-zoom, more than two pointers will be ignored
	onceChanged(pointers, () => {
		if (pointers.length === 1 && event.target === canvas.ref && !canvas.anyArrowKey) {
			if (event.metaKey || event.ctrlKey) {
				selection.clear()

				state.selecing = true
				unwatchCanvas = watch(canvas, onPointerMove)
			} else {
				state.panning = true
				clickAllowed = !usingInput()
			}

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

	// Update the selection
	if (state.selecing) {
		if (!selection.rect) {
			const downPos = canvas.toCanvasPos(pointer.down as Pos)

			selection.rect = new DOMRect(downPos.x, downPos.y, 0, 0)
			selection.visible = true
		}

		const pointerPos = canvas.toCanvasPos(pointer)

		selection.rect = new DOMRect(
			selection.rect.x,
			selection.rect.y,
			pointerPos.x - selection.rect.x,
			pointerPos.y - selection.rect.y
		)

		canvas.edgeScroll()
	}

	// Pan the canvas
	if (state.panning) {
		canvas.scroll.x += pointer.movementX
		canvas.scroll.y += pointer.movementY
		canvas.smoothScroll.x = canvas.scroll.x
		canvas.smoothScroll.y = canvas.scroll.y
	}
}

function onPointerUp() {
	if (pointer.down && pointers.length === 1)
		return

	if (state.panning && pointer.moved) {
		clickAllowed = false

		// Make scrolling feel like it has inertia on touch devices
		const velocity = { x: pointer.movementX, y: pointer.movementY }

		if (pointer.type === 'touch' && moveThreshold(velocity, { x: 0, y: 0 }, 4))
			canvas.kineticScroll(velocity)
	}

	if (state.selecing) {
		selection.visible = false
		clickAllowed = false

		canvas.stopEdgeScroll()
		unwatchCanvas()
	}

	state.panning = false
	state.selecing = false

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
	if (!clickAllowed)
		return

	selection.clear()

	// Require doubleclick to create a card when using a mouse
	if (pointer.type === 'mouse' && event.detail !== 2)
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
		if (isMouseWheel && event.shiftKey && !deltaX)
			[deltaX, deltaY] = [deltaY, deltaX]

		canvas.scroll.x -= deltaX
		canvas.scroll.y -= deltaY

		if (isMouseWheel)
			canvas.animate()
		else {
			canvas.smoothScroll.x = canvas.scroll.x
			canvas.smoothScroll.y = canvas.scroll.y
		}

		if (pointer.down && !pointer.moved)
			pointer.moved = true
	}
}

async function onPaste(event: ClipboardEvent | DragEvent) {
	if (!state.pointerOver || usingInput())
		return

	const dataTransfer = event instanceof ClipboardEvent ? event.clipboardData : event.dataTransfer
	const pastedCards = await pasteOnCanvas(canvas, dataTransfer, pointer)

	if (pastedCards.length) {
		selection.clear()

		// Select the pasted cards
		selection.cards = pastedCards
	}
}
</script>

<template>
	<div
		ref="canvas-ref"
		class="canvas"
		:style="{ cursor }"
		@pointerdown.left="onPointerDown"
		@pointerdown.middle="onPointerDown"
		@pointerenter="state.pointerOver = true"
		@pointerleave="state.pointerOver = false"
		@pointercancel ="state.pointerOver = false"
		@click.left.self="onClick"
		@wheel.prevent="onWheel"
		@dragenter="state.pointerOver = true"
		@dragleave="state.pointerOver = false"
		@dragover.stop.prevent
		@drop.prevent="onPaste"
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
				:selection
			/>
		</div>
		<div
			class="selection"
			:style="selectionStyle"
		/>
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
	outline: 1px solid #303030;

	.canvas-background {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;

		circle {
			fill: #383838;
		}
	}

	.stuff {
		position: absolute;
	}

	.selection {
		position: absolute;
		background-color: var(--color-accent-25);
		border: 1px solid var(--color-accent);
		pointer-events: none;
	}
}
</style>
