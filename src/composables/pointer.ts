import { onBeforeUnmount, reactive } from 'vue'
import { useEventListener } from '@vueuse/core'
import { isPointerCoarse, moveThreshold } from '../utils'

// Add pointer events to the document, this prevents drag and drop from being
// canceled when the mouse leaves the window

export function usePointer() {
	const pointer = reactive<PointerState>({
		down: false,
		moved: false,
		x: 0,
		y: 0,
		movementX: 0,
		movementY: 0,
		type: 'none',
		id: 0
	})

	useEventListener('pointerdown', (event: PointerEvent) => {
		// Ignore this pointer if a different one is already being tracked
		if (pointer.id && pointer.id !== event.pointerId)
			return

		// Start tracking the pointer
		pointer.down = {
			x: event.clientX,
			y: event.clientY
		}
		pointer.x = event.clientX
		pointer.y = event.clientY
		pointer.type = event.pointerType
		pointer.id = event.pointerId
	})

	useEventListener('pointermove', (event: PointerEvent) => {
		if (pointer.id && pointer.id !== event.pointerId)
			return

		// Update pointer position and movement
		pointer.x = event.clientX
		pointer.y = event.clientY
		pointer.movementX = event.movementX
		pointer.movementY = event.movementY

		// Add a different move threshold for mouse and touch
		if (pointer.down && moveThreshold(pointer.down, pointer, isPointerCoarse ? 10 : 4))
			pointer.moved = true
	})

	useEventListener('pointerup', (event: PointerEvent) => {
		if (pointer.id !== event.pointerId)
			return

		pointer.down = false
		pointer.moved = false
		pointer.id = 0
	})

	return pointer
}
