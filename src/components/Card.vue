<script setup lang="ts">
import { computed, inject, reactive, useTemplateRef, watch, type WatchHandle } from 'vue'
import { onceChanged, rectsOverlap, suppressEvent } from '../utils'
import { updateCard, updateMany } from '../composables/cards'
import CardContentText from './CardContentText.vue'
import CardContentImage from './CardContentImage.vue'

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
	else if (selection.rectVisible || selection.draw)
		return 'inherit'
	else if (state.dragging)
		return 'grabbing'

	return 'grab'
})
let unwatchPointer: WatchHandle
let unwatchPointerMove: WatchHandle
let unwatchPointerUp: WatchHandle

watch([() => selection.rect], () => {
	const cardRect = canvas.toCanvasRect(cardRef.value!.getBoundingClientRect())

	// Check if the card is in the selection
	state.selected = !!selection.rect && rectsOverlap(selection.rect, cardRect)
}, { flush: 'sync' })

watch([() => selection.cards], () => {
	state.selected = selection.cards.includes(card)
}, { flush: 'sync' })

watch([() => selection.draw], () => {
	if (selection.draw) {
		unwatchPointer = watch(pointer, () => {
			const cardRect = cardRef.value!.getBoundingClientRect()
			const pointerRect = new DOMRect(pointer.x - 10, pointer.y - 10, 20, 20)

			if (rectsOverlap(cardRect, pointerRect))
				state.selected = true
		})
	} else
		unwatchPointer()
})

watch(() => state.selected, () => {
	if (state.selected) {
		if (!selection.cards.includes(card))
			selection.cards.push(card)
	} else
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

	const prevPosition = card.pos

	// Move the card
	card.pos = canvas.toCanvasPos({
		x: pointer.x - state.downOffset.x * canvas.smoothZoom / state.downOffset.zoom,
		y: pointer.y - state.downOffset.y * canvas.smoothZoom / state.downOffset.zoom
	})

	// Move other selected cards
	if (selection.cards.length > 1) {
		selection.cards.filter((selected: Card) => selected !== card).forEach((c: Card) => {
			c.pos = {
				x: c.pos.x + card.pos.x - prevPosition.x,
				y: c.pos.y + card.pos.y - prevPosition.y
			}
		})
	}

	canvas.edgeScroll()
}

function onPointerUp() {
	if (pointer.down && pointers.length === 1)
		return

	state.dragging = false

	if (pointer.moved) {
		if (pointer.type === 'mouse')
			suppressEvent('click')

		canvas.stopEdgeScroll()

		if (selection.cards.length > 1)
			updateMany(selection.cards)
		else
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

function getContentComponent() {
	switch (card.type) {
		case 'text': return CardContentText
		case 'image': return CardContentImage
	}
}
</script>

<template>
	<div
		ref="card-ref"
		class="card"
		:class="{ selected: state.selected }"
		:style="{
			translate: `${card.pos.x}px ${card.pos.y}px`,
			cursor,
			zIndex: contentRef?.active || state.selected || state.dragging ? 1 : 0
		}"
		@pointerdown.left.exact="onPointerDown"
		@click.left.exact="selection.clear()"
		@click.left.ctrl.exact="state.selected = !state.selected"
		@click.left.meta.exact="state.selected = !state.selected"
	>
		<component
			ref="content-ref"
			:is="getContentComponent()"
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
