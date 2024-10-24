<script setup lang="ts">
import { provide, reactive } from 'vue'
import { useEventListener } from '@vueuse/core'
import { isPointerCoarse, moveThreshold } from './utils'
import Board from './components/Board.vue'

// Add pointer events to the document,
// this prevents drag and drop from being canceled when the mouse leaves the window
const pointer = reactive<PointerState>({
	down: false,
	moved: false,
	x: 0,
	y: 0,
	movementX: 0,
	movementY: 0,
	type: 'none'
})

useEventListener('pointerdown', (event: PointerEvent) => {
	pointer.down = {
		x: event.clientX,
		y: event.clientY
	}
	pointer.x = event.clientX
	pointer.y = event.clientY
	pointer.type = event.pointerType
})

useEventListener('pointermove', (event: PointerEvent) => {
	pointer.x = event.clientX
	pointer.y = event.clientY
	pointer.movementX = event.movementX
	pointer.movementY = event.movementY

	// Add a different move threshold for mouse and touch
	if (pointer.down && moveThreshold(pointer.down, pointer, isPointerCoarse ? 10 : 4))
		pointer.moved = true
})

useEventListener('pointerup', () => {
	pointer.down = false
	pointer.moved = false
})

provide('pointer', pointer)
</script>

<template>
	<main>
		<Board />
	</main>
</template>
