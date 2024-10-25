<script setup lang="ts">
import { computed, reactive, useTemplateRef, watch, WatchHandle } from 'vue'
import { usePointer } from '../composables/pointer'
import { createCard } from '../cards'
import Card from './Card.vue'

const { cards } = defineProps<{ cards: Card[] }>()
const canvasRef = useTemplateRef('canvas')
const state = reactive({
	ref: canvasRef,
	active: false,
	scroll: {
		x: 0,
		y: 0
	}
}) as Canvas
const pointer = usePointer()
const animating = computed(() => pointer.down)
const gridSize = computed(() => {
	// Adjust the background grid size to the zoom level
	let value = 20 * 1

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

	state.active = true
	clickAllowed = document.activeElement === document.body
	unwatchPointerMove = watch(pointer, onPointerMove)
	unwatchPointerUp = watch(() => pointer.down, onPointerUp, { flush: 'sync' })
}

function onPointerMove() {
	if (!pointer.moved)
		return

	state.scroll.x += pointer.movementX
	state.scroll.y += pointer.movementY
}

function onPointerUp() {
	if (pointer.down)
		return

	state.active = false

	if (pointer.moved)
		clickAllowed = false

	unwatchPointerMove()
	unwatchPointerUp()
}

function onClick(event: MouseEvent) {
	// Require doubleclick to create a card when using a mouse
	if (!clickAllowed || (pointer.type === 'mouse' && event.detail !== 2))
		return

	const canvasRect = canvasRef.value!.getBoundingClientRect()
	const pos = {
		x: pointer.x - state.scroll.x - canvasRect.x,
		y: pointer.y - state.scroll.y - canvasRect.y
	}

	createCard({ pos })
}
</script>

<template>
	<div
		ref="canvas"
		class="canvas"
		:style="{ cursor: state.active && pointer.moved ? 'move' : 'default' }"
		@pointerdown.left.self="onPointerDown"
		@pointerdown.middle.self="onPointerDown"
		@click.left.self="onClick"
	>
		<svg class="canvas-background">
			<pattern
				id="dot-pattern"
				patternUnits="userSpaceOnUse"
				:x="state.scroll.x"
				:y="state.scroll.y"
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
				translate: `${state.scroll.x}px ${state.scroll.y}px`,
				willChange: animating ? 'transform' : 'auto'
			}"
		>
			<Card
				v-for="card of cards"
				:key="card.id"
				:card
				:canvas="state"
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
