<script setup lang="ts">
import { reactive, useTemplateRef, watch, WatchHandle } from 'vue'
import { usePointer } from '../composables/pointer'
import { suppressClick } from '../utils'
import { updateCard } from '../cards'
import CardContent from './CardContent.vue'

const { card, canvas } = defineProps<{
	card: Card,
	canvas: Canvas
}>()
const cardRef = useTemplateRef('card')
const contentRef = useTemplateRef('content')
const state = reactive({
	active: false,
	downOffset: {
		x: 0,
		y: 0
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
	state.downOffset.x = event.clientX - cardRect.x
	state.downOffset.y = event.clientY - cardRect.y
	unwatchPointerMove = watch(pointer, onPointerMove)
	unwatchPointerUp = watch(() => pointer.down, onPointerUp, { flush: 'sync' })
}

function onPointerMove() {
	if (!pointer.moved)
		return

	const cardRect = canvas.ref.getBoundingClientRect()

	card.pos.x = pointer.x - state.downOffset.x - canvas.scroll.x - cardRect.x
	card.pos.y = pointer.y - state.downOffset.y - canvas.scroll.y - cardRect.y
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
		ref="card"
		class="card"
		:class="{ active: state.active }"
		:style="{
			left: card.pos.x + 'px',
			top: card.pos.y + 'px',
			cursor: contentRef?.active ? 'auto' : state.active ? 'grabbing' : 'grab'
		}"
		@pointerdown.left="onPointerDown"
	>
		<CardContent ref="content" :card />
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
