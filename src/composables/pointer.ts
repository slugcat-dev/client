import { reactive } from 'vue'
import { createGlobalState, useEventListener } from '@vueuse/core'
import { isPointerCoarse, moveThreshold } from '../utils'

// Add pointer events to the document, this prevents drag and drop from being
// canceled when the mouse leaves the window

export const usePointer = createGlobalState(() => {
	const pointers = reactive<PointerState[]>([])
	const pointer = reactive<PointerState>({
		id: 0,
		down: false,
		moved: false,
		x: 0,
		y: 0,
		movementX: 0,
		movementY: 0,
		type: 'none',
		ctrlKey: false,
		metaKey: false,
		shiftKey: false,
		altKey: false
	})

	useEventListener('pointerdown', (event: PointerEvent) => {
		// Start tracking the pointer
		const index = pointerIndex(event)

		if (index !== undefined)
			pointers[index].down = { x: event.clientX, y: event.clientY }
		else
			trackPointer(event)

		// Ignore mouse while using a touch screen
		if (event.pointerType === 'touch' || event.pointerType === 'pen') {
			const mouseIndex = pointers.findIndex(p => p.type === 'mouse')

			if (mouseIndex !== -1) {
				pointers.splice(mouseIndex, 1)

				pointer.down = false
				pointer.moved = false
				pointer.id = 0
			}
		}

		if (!pointer.id || pointer.id === event.pointerId)
			syncPointer(index)
	})

	useEventListener('pointermove', (event: PointerEvent) => {
		const index = pointerIndex(event)

		if (index !== undefined) {
			// Update pointer position and movement
			pointers[index].movementX = event.clientX - pointers[index].x
			pointers[index].movementY = event.clientY - pointers[index].y
			pointers[index].x = event.clientX
			pointers[index].y = event.clientY

			// Add a different move threshold for mouse and touch
			if (pointers[index].down && moveThreshold(pointers[index].down, pointers[index], isPointerCoarse() ? 10 : 4))
				pointers[index].moved = true
		} else
			trackPointer(event)

		if (!pointer.id || pointer.id === event.pointerId)
			syncPointer(index)

		pointer.ctrlKey = event.ctrlKey
		pointer.metaKey = event.metaKey
		pointer.shiftKey = event.shiftKey
		pointer.altKey = event.altKey
	})

	useEventListener(['pointerup', 'pointercancel'], (event: PointerEvent) => {
		const index = pointerIndex(event)

		if (index !== undefined) {
			pointers[index].down = false
			pointers[index].moved = false

			if (pointers[index].type === 'touch' || pointers[index].type === 'pen')
				pointers.splice(index, 1)
		}

		if (pointer.id === event.pointerId) {
			pointer.down = false
			pointer.moved = false
			pointer.id = 0
		}
	})

	useEventListener(['keydown', 'keyup'], (event: KeyboardEvent) => {
		pointer.ctrlKey = event.ctrlKey
		pointer.metaKey = event.metaKey
		pointer.shiftKey = event.shiftKey
		pointer.altKey = event.altKey
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
			movementX: 0,
			movementY: 0,
			type: event.pointerType,
			ctrlKey: false,
			metaKey: false,
			shiftKey: false,
			altKey: false
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
})
