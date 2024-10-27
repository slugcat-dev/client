<script setup lang="ts">
import { inject, reactive, useTemplateRef, watch, type WatchHandle } from 'vue'
import { onceChanged, suppressClick } from '../utils'
import { updateCard } from '../composables/cards'
import CardContent from './CardContent.vue'

const { card, canvas } = defineProps<{
	card: Card,
	canvas: Canvas
}>()
const cardRef = useTemplateRef('card-ref')
const contentRef = useTemplateRef('content-ref')
const state = reactive({
	dragging: false,
	downOffset: {
		x: 0,
		y: 0,
		zoom: 0
	}
})
const pointer = inject('pointer') as PointerState
const pointers = inject('pointers') as PointerState[]
let unwatchPointerMove: WatchHandle
let unwatchPointerUp: WatchHandle

function onPointerDown(event: PointerEvent) {
	// Wait until the event has bubbled to the listener on the document that updates the pointer state
	onceChanged(pointer, () => {
		if (!cardInteractionAllowed(event))
			return

		const cardRect = cardRef.value!.getBoundingClientRect()

		state.dragging = true
		state.downOffset = {
			x: event.clientX - cardRect.x,
			y: event.clientY - cardRect.y,
			zoom: canvas.smoothZoom
		}
		unwatchPointerMove = watch([pointer, canvas], onPointerMove)
		unwatchPointerUp = watch([
			() => pointer.down,
			() => pointers.length
		], onPointerUp, { flush: 'sync' })
	})
}

function onPointerMove() {
	if (!pointer.moved)
		return

	card.pos = canvas.toCanvasPos({
		x: pointer.x - state.downOffset.x * canvas.smoothZoom / state.downOffset.zoom,
		y: pointer.y - state.downOffset.y * canvas.smoothZoom / state.downOffset.zoom
	})
}

function onPointerUp() {
	if (pointer.down && pointers.length === 1)
		return

	state.dragging = false

	if (pointer.moved) {
		if (pointer.type === 'mouse')
			suppressClick()

		updateCard(card)
	}

	unwatchPointerMove()
	unwatchPointerUp()
}

function cardInteractionAllowed(event: Event) {
	return (
		typeof card.id === 'number'
		&& pointers.length === 1
		&& !contentRef.value?.active
		&& !(event.target instanceof HTMLAnchorElement)
	)
}
</script>

<template>
	<div
		ref="card-ref"
		class="card"
		:style="{
			left: card.pos.x + 'px',
			top: card.pos.y + 'px',
			cursor: contentRef?.active ? 'auto' : state.dragging ? 'grabbing' : 'grab',
			zIndex: state.dragging ? 1 : 0
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
}
</style>
