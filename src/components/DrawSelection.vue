<script setup lang="ts">
import { onMounted, useTemplateRef, watch } from 'vue'
import { usePointer } from '../composables/pointer'
import { useEventListener } from '@vueuse/core'

// "canvas" refers to the canvas element the pointer trail is drawn to in this file,
// not the Canvas component or the canvas state object

const { selection } = defineProps<{ selection: CanvasSelection }>()
const canvasRef = useTemplateRef('canvas-ref')
const { pointer } = usePointer()
let animationLock = false
let sizeModifier = 4
let path: Pos[] = []
let points: Pos[]
let canvas: HTMLCanvasElement
let canvasRect: DOMRect
let ctx: CanvasRenderingContext2D
let colorAccent: string
let prevTimestamp: number

onMounted(() => {
	canvas = canvasRef.value!
	canvasRect = canvas.getBoundingClientRect()
	ctx = canvas.getContext('2d')!

	setup()
})

// Rescale the canvas when the window dimensions change
useEventListener(window, 'resize', setup)

watch(() => selection.draw, () => {
	// Start drawing the pointer trail
	if (selection.draw) {
		path = []
		points = new Array(10).fill(null).map(() => (toCanvasPos(pointer)))
		colorAccent = getComputedStyle(canvas).color

		if (!animationLock) {
			animationLock = true
			prevTimestamp = performance.now()

			requestAnimationFrame(drawTail)
		}
	}
})

function drawTail(timestamp: number) {
	const delta = Math.max(timestamp - prevTimestamp, 0) / (1000 / 60)

	path.push(toCanvasPos(pointer))

	// Limit the path length
	if (path.length > 11)
		path.shift()

	// Maker the points follow the pointer
	for (let i = 0; i < points.length; i++) {
		if (path[i]) {
			points[i].x += (path[i].x - points[i].x) * .75 * delta
			points[i].y += (path[i].y - points[i].y) * .75 * delta
		}
	}

	ctx.clearRect(0, 0, canvas.width, canvas.height)

	ctx.lineCap = 'round'
	ctx.lineJoin = 'round'
	ctx.lineWidth = 40 * sizeModifier
	ctx.strokeStyle = colorAccent
	ctx.fillStyle = colorAccent

	// Draw the pointer trail as smooth curve
	ctx.beginPath()
	ctx.moveTo(points[0].x, points[0].y)

	for (let i = 1; i < points.length - 1; i++) {
		const xc = .5 * (points[i].x + points[i + 1].x)
		const yc = .5 * (points[i].y + points[i + 1].y)

		ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc)
		ctx.stroke()
	}

	ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y)
	ctx.lineTo(pointer.x - canvasRect.x, pointer.y - canvasRect.y)
	ctx.stroke()
	ctx.closePath()

	ctx.beginPath()
	ctx.arc(pointer.x - canvasRect.x, pointer.y - canvasRect.y, 20 * sizeModifier, 0, Math.PI * 2)
	ctx.fill()
	ctx.closePath()

	// Fade size in and out
	if (selection.draw && sizeModifier > 1)
		sizeModifier += (1 - sizeModifier) * .125 * delta
	else if (sizeModifier > 0)
		sizeModifier += (0 - sizeModifier) * .125 * delta

	// Stop the animation loop
	if (Math.abs(sizeModifier) < .125) {
		animationLock = false
		sizeModifier = 4

		ctx.clearRect(0, 0, canvas.width, canvas.height)

		return
	} else
		requestAnimationFrame(drawTail)

	prevTimestamp = timestamp
}

function setup() {
	const dpr = window.devicePixelRatio
	const computedStyle = getComputedStyle(canvas)

	canvas.width = Number.parseFloat(computedStyle.width) * dpr
	canvas.height = Number.parseFloat(computedStyle.height) * dpr

	ctx.scale(dpr, dpr)
}

function toCanvasPos(pos: Pos) {
	return { x: pos.x - canvasRect.x, y: pos.y - canvasRect.y }
}
</script>

<template>
	<canvas
		ref="canvas-ref"
		class="draw-selection"
		:style="{ opacity: selection.draw ? 1 : 0 }"
	></canvas>
</template>

<style>
.draw-selection {
	position: absolute;
	width: 100%;
	height: 100%;
	color: var(--color-accent);
	transition: opacity 200ms ease-out;
	pointer-events: none;
}
</style>
