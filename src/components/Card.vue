<script setup lang="ts">
import { computed, type ComputedRef, inject, reactive, toRef, useTemplateRef, watch, type WatchHandle } from 'vue'
import { onceChanged, rectContains, rectsOverlap, suppressClick } from '../utils'
import { updateCard, updateMany } from '../composables/cards'
import type Card from './Card.vue'
import CardContentBox from './CardContentBox.vue'
import CardContentText from './CardContentText.vue'
import CardContentImage from './CardContentImage.vue'

type CardRef = InstanceType<typeof Card>
type CardContentRef = InstanceType<ReturnType<typeof getContentComponent>>
type CardContentBoxRef = InstanceType<typeof CardContentBox>
type CardContentImageRef = InstanceType<typeof CardContentImage>

const { card, canvas, selection } = defineProps<{
	card: Card,
	canvas: Canvas,
	selection: CanvasSelection
}>()
const cardRef = useTemplateRef('card-ref')
const contentRef = useTemplateRef<CardContentRef>('content-ref')
const state = reactive({
	selected: false,
	dragging: false,
	resizing: false as boolean | string,
	downState: {
		offsetX: 0,
		offsetY: 0,
		zoom: 0,
		width: 0,
		height: 0
	}
})
const pointer = inject('pointer') as PointerState
const pointers = inject('pointers') as PointerState[]
const cardRefs = inject('card-refs') as ComputedRef<CardRef[]>
const cursor = computed(() => {
	if (contentRef.value?.active)
		return 'auto'
	else if (selection.boxVisible || selection.draw)
		return 'inherit'
	else if (state.dragging)
		return 'grabbing'

	return 'grab'
})
const zIndex = computed(() => {
	const isActive = contentRef.value?.active
		|| state.dragging
		|| card.type !== 'box' && state.selected
		|| card.type !== 'box' && state.resizing

	return isActive ? 1 : 0
})
let cardRefMap = new Map<Card, CardRef>()
let relatedCards = new Set<Card>()
let unwatchPointer: WatchHandle
let unwatchPointerMove: WatchHandle
let unwatchPointerUp: WatchHandle

watch([() => selection.cards], () => {
	state.selected = selection.cards.includes(card)
})

watch([() => selection.box], () => {
	if (selection.box) {
		const cardRect = canvas.toCanvasRect(cardRef.value!.getBoundingClientRect())

		// Check if the card is in the selection box
		state.selected = !!selection.box && rectsOverlap(selection.box, cardRect)
	}
})

watch([() => selection.draw], () => {
	if (selection.draw) {
		// Select the card when the pointer is moved over it during draw selection
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
		if (!selection.cards.includes(card)) {
			selection.cards.push(card)

			if (navigator.vibrate)
				navigator.vibrate(50)
		}
	} else
		selection.cards.splice(selection.cards.indexOf(card), 1)
})

function onPointerDown(event: PointerEvent) {
	// Wait until the event has bubbled to the listener on the document that updates the pointer state
	onceChanged(pointer, () => {
		if (typeof card.id !== 'number' || contentRef.value!.active || pointers.length !== 1)
			return

		cardRefMap = new Map(cardRefs.value.map(cardRef => [cardRef.card, cardRef]))

		const targetClassName = (event.target as HTMLElement).className

		if ((card.type === 'box' || card.type === 'image') && targetClassName.startsWith('resize')) {
			state.resizing = targetClassName

			selection.clear()
			relatedCards.clear()
		} else {
			state.dragging = true

			if (!state.selected)
				selection.clear()

			// Collect all cards that should be dragged along
			relatedCards = new Set(selection.cards.filter(c => c !== card))

			function addRelatedBoxCards(boxCard: Card) {
				if (boxCard.type !== 'box')
					return

				const boxCardRef = cardRefMap.get(boxCard)!
				const boxRect = (boxCardRef.contentRef! as CardContentBoxRef).boxRef!.getBoundingClientRect()

				cardRefMap.forEach(cardRef => {
					if (cardRef.card !== card && rectContains(boxRect, cardRef.ref!.getBoundingClientRect())) {
						cardRef.dragging = true

						relatedCards.add(cardRef.card)
						addRelatedBoxCards(cardRef.card)
					}
				})
			}

			[card, ...relatedCards].forEach(addRelatedBoxCards)
		}

		const cardRect = cardRef.value!.getBoundingClientRect()

		state.downState.offsetX = event.clientX - cardRect.x
		state.downState.offsetY = event.clientY - cardRect.y
		state.downState.zoom = canvas.smoothZoom

		if (card.type === 'box' || card.type === 'image') {
			state.downState.width = card.content.width
			state.downState.height = card.content.height
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

	const prevPos = card.pos
	const newPos = canvas.toCanvasPos({
		x: pointer.x - state.downState.offsetX * canvas.smoothZoom / state.downState.zoom,
		y: pointer.y - state.downState.offsetY * canvas.smoothZoom / state.downState.zoom
	})

	if (state.dragging) {
		card.pos = newPos

		if (relatedCards.size) {
			relatedCards.forEach(c => {
				c.pos.x += card.pos.x - prevPos.x
				c.pos.y += card.pos.y - prevPos.y
			})
		}
	}

	if (state.resizing) {
		// Boxes can be resized freely
		if (card.type === 'box') {
			if (state.resizing === 'resize-h' || state.resizing === 'resize-d')
				card.content.width = Math.max(state.downState.width + newPos.x - card.pos.x, 40)

			if (state.resizing === 'resize-v' || state.resizing === 'resize-d')
				card.content.height = Math.max(state.downState.height + newPos.y - card.pos.y, 40)
		}

		// Images need to retain aspect ratio while resizing
		if (card.type === 'image') {
			const { imgWidth, imgHeight } = contentRef.value as CardContentImageRef
			const aspectRatio = imgWidth / imgHeight
			let newWidth = Math.max(state.downState.width + newPos.x - card.pos.x, 40)
			let newHeight = Math.max(state.downState.height + newPos.y - card.pos.y, 40)

			if (newWidth / newHeight < aspectRatio)
				newWidth = newHeight * aspectRatio
			else
				newHeight = newWidth / aspectRatio

			card.content.width = Math.min(newWidth, imgWidth)
			card.content.height = Math.min(newHeight, imgHeight)
		}
	}

	canvas.edgeScroll()
}

function onPointerUp() {
	if (pointer.down && pointers.length === 1)
		return

	if (pointer.moved) {
		if (pointer.type === 'mouse')
			suppressClick()

		canvas.stopEdgeScroll()

		if (relatedCards.size)
			updateMany([card, ...relatedCards])
		else
			updateCard(card)
	}

	relatedCards.forEach(relatedCard => cardRefMap.get(relatedCard)!.dragging = false)

	state.dragging = false
	state.resizing = false

	unwatchPointerMove()
	unwatchPointerUp()
}

function getContentComponent() {
	switch (card.type) {
		case 'box': return CardContentBox
		case 'text': return CardContentText
		case 'image': return CardContentImage
	}
}

defineExpose({ card, ref: cardRef, contentRef, dragging: toRef(state, 'dragging') })
</script>

<template>
	<div
		ref="card-ref"
		class="card"
		:class="{ selected: state.selected }"
		:style="{
			translate: `${card.pos.x}px ${card.pos.y}px`,
			willChange: state.dragging && pointer.moved ? 'transform' : 'auto',
			cursor,
			zIndex
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
