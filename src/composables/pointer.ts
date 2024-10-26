import { reactive } from 'vue'
import { useEventListener } from '@vueuse/core'
import { isPointerCoarse, moveThreshold } from '../utils'

// Add pointer events to the document, this prevents drag and drop from being
// canceled when the mouse leaves the window

export function usePointer() {
	const pointers = reactive<PointerState[]>([])
	const pointer = reactive<PointerState>({
		id: 0,
		down: false,
		moved: false,
		x: 0,
		y: 0,
		movementX: 0,
		movementY: 0,
		type: 'none'
	})

	useEventListener('pointerdown', (event: PointerEvent) => {
		// Start tracking the pointer
		const index = pointerIndex(event)

		if (index !== undefined)
			pointers[index].down = { x: event.clientX, y: event.clientY }
		else
			trackPointer(event)

		if (!pointer.id || pointer.id === event.pointerId)
			syncPointer(index)
	})

	useEventListener('pointermove', (event: PointerEvent) => {
		const index = pointerIndex(event)

		if (index !== undefined) {
			// Update pointer position and movement
			pointers[index].x = event.clientX
			pointers[index].y = event.clientY
			pointers[index].movementX = event.movementX
			pointers[index].movementY = event.movementY

			// Add a different move threshold for mouse and touch
			if (pointers[index].down && moveThreshold(pointers[index].down, pointers[index], isPointerCoarse ? 10 : 4))
				pointers[index].moved = true
		} else
			trackPointer(event)

		if (!pointer.id || pointer.id === event.pointerId)
			syncPointer(index)
	})

	useEventListener(['pointerup', 'pointercancel'], (event: PointerEvent) => {
		const index = pointerIndex(event)

		if (index !== undefined) {
			pointers[index].down = false
			pointers[index].moved = false

			if (pointers[index].type === 'touch')
				pointers.splice(index, 1)
		}

		if (pointer.id === event.pointerId) {
			pointer.down = false
			pointer.moved = false
			pointer.id = 0
		}
	})

	function pointerIndex(event: PointerEvent) {
		const index = pointers.findIndex(p => p.id === event.pointerId)

		if (index === -1)
			return undefined

		return index
	}

	function trackPointer(event: PointerEvent) {
		pointers.push({
			id: event.pointerId,
			down: event.type === 'pointermove'
				? false
				: { x: event.clientX, y: event.clientY },
			moved: false,
			x: event.clientX,
			y: event.clientY,
			movementX: event.movementX,
			movementY: event.movementY,
			type: event.pointerType
		})
	}

	function syncPointer(index: number | undefined) {
		const src = pointers[index ?? pointers.length - 1]

		pointer.id = src.id
		pointer.down = src.down
		pointer.moved = src.moved
		pointer.x = src.x
		pointer.y = src.y
		pointer.movementX = src.movementX
		pointer.movementY = src.movementY
		pointer.type = src.type
	}

	return { pointer, pointers }
}
