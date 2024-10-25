<script setup lang="ts">
import { reactive, useTemplateRef, watch, type WatchHandle } from 'vue'
import { usePointer } from '../composables/pointer'
import { suppressClick } from '../utils'
import { updateCard } from '../composables/cards'
import CardContent from './CardContent.vue'

const { card, canvas } = defineProps<{
	card: Card,
	canvas: Canvas
}>()
const cardRef = useTemplateRef('card-ref')
const contentRef = useTemplateRef('content-ref')
const state = reactive({
	active: false,
	downOffset: {
		x: 0,
		y: 0,
		zoom: 0
	}
})
const pointer = usePointer()
let unwatchPointerMove: WatchHandle
let unwatchPointerUp: WatchHandle

function onPointerDown(event: PointerEvent) {
	if (pointer.down || contentRef.value!.active)
		return

	const cardRect = cardRef.value!.getBoundingClientRect()

	state.active = true
	state.downOffset = {
		x: event.clientX - cardRect.x,
		y: event.clientY - cardRect.y,
		zoom: canvas.smoothZoom
	}
	unwatchPointerMove = watch([pointer, canvas], onPointerMove)
	unwatchPointerUp = watch(() => pointer.down, onPointerUp, { flush: 'sync' })
}

function onPointerMove() {
	if (!pointer.moved)
		return

	const zoomDelta = canvas.smoothZoom / state.downOffset.zoom

	card.pos = canvas.toCanvasPos({
		x: pointer.x - state.downOffset.x * zoomDelta,
		y: pointer.y - state.downOffset.y * zoomDelta
	})
}

function onPointerUp() {
	if (pointer.down)
		return

	state.active = false

	unwatchPointerMove()
	unwatchPointerUp()

	if (pointer.moved) {
		if ((pointer as PointerDownState).type === 'mouse')
			suppressClick()

		updateCard(card)
	}
}
</script>

<template>
	<div
		ref="card-ref"
		class="card"
		:class="{ active: state.active }"
		:style="{
			left: card.pos.x + 'px',
			top: card.pos.y + 'px',
			cursor: contentRef?.active ? 'auto' : state.active ? 'grabbing' : 'grab'
		}"
		@pointerdown.left="onPointerDown"
	>
		<CardContent
			ref="content-ref"
			:card
			:canvas
		/>
	</div>
</template>

<style>
.card {
	position: absolute;

	&.active {
		z-index: 1;
	}
}
</style>
