<script setup lang="ts">
import { computed, inject, reactive, useTemplateRef, watch, WatchHandle } from 'vue'
import { suppressClick } from '../utils'
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
const pointer = inject<PointerState>('pointer')!
const animating = computed(() => pointer.down)
const gridSize = computed(() => {
	// Adjust the background grid size to the zoom level
	let value = 20 * 1

	while (value <= 10) value *= 2
	while (value >= 30) value /= 2

	return value
})
let unwatchPointerMove: WatchHandle
let unwatchPointerUp: WatchHandle

function onPointerDown() {
	state.active = true
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

	unwatchPointerMove()
	unwatchPointerUp()

	if (pointer.type === 'mouse' && pointer.moved)
		suppressClick()
}

function onClick() {
	console.log('create card')
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

	/* Tmp */
	outline: 1px solid #5555;
	top: 24px;
	left: 48px;
	width: calc(100vw - 48px);
	height: calc(100vh - 24px);
	/* Tmp */

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
