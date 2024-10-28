<script setup lang="ts">
import { computed, inject, reactive, useTemplateRef, watch, type WatchHandle } from 'vue'
import { onceChanged, rectsOverlap, suppressClick } from '../utils'
import { updateCard } from '../composables/cards'
import CardContent from './CardContent.vue'

const { card, canvas, selection } = defineProps<{
	card: Card,
	canvas: Canvas,
	selection: CanvasSelection
}>()
const cardRef = useTemplateRef('card-ref')
const contentRef = useTemplateRef('content-ref')
const state = reactive({
	selected: false,
	dragging: false,
	downOffset: {
		x: 0,
		y: 0,
		zoom: 0
	}
})
const pointer = inject('pointer') as PointerState
const pointers = inject('pointers') as PointerState[]
const cursor = computed(() => {
	if (contentRef.value?.active)
		return 'auto'
	else if (selection.visible)
		return 'inherit'
	else if (state.dragging)
		return 'grabbing'

	return 'grab'
})
let unwatchPointerMove: WatchHandle
let unwatchPointerUp: WatchHandle

watch(() => selection.rect, () => {
	const cardRect = canvas.toCanvasRect(cardRef.value!.getBoundingClientRect())

	// Check if the card is in the selection
	state.selected = !!selection.rect && rectsOverlap(selection.rect, cardRect)
})

watch(() => state.selected, () => {
	if (state.selected)
		selection.cards.push(card)
	else
		selection.cards.splice(selection.cards.indexOf(card), 1)
})

function onPointerDown(event: PointerEvent) {
	if (!state.selected)
		selection.clear()

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

	canvas.edgeScroll()
}

function onPointerUp() {
	if (pointer.down && pointers.length === 1)
		return

	state.dragging = false

	if (pointer.moved) {
		if (pointer.type === 'mouse')
			suppressClick()

		canvas.stopEdgeScroll()
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
		:class="{ selected: state.selected }"
		:style="{
			left: card.pos.x + 'px',
			top: card.pos.y + 'px',
			cursor,
			zIndex: contentRef?.active || state.selected || state.dragging ? 1 : 0
		}"
		@pointerdown.left.exact="onPointerDown"
		@click.left.ctrl.exact="state.selected = !state.selected"
		@click.left.meta.exact="state.selected = !state.selected"
	>
		<CardContent
			ref="content-ref"
			:card
			:canvas
			:selection
		/>
	</div>
</template>

<style>
.card {
	position: absolute;
}
</style>
