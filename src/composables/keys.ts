import { useEventListener } from '@vueuse/core'
import { isMac, usingInput } from '../utils'
import { reactive } from 'vue'

export function useKeymap(keymap: Keymap) {
	const compiledKeymap = Object.entries(keymap).map(([key, handler]) => {
		const parts = key.toLowerCase().split(' ')

		// Convert modifiers for macOS and normal operating systems
		let ctrlKey = parts.includes('ctrl')
		let metaKey = parts.includes('meta')
		let altKey = parts.includes('alt')

		if (isMac) {
			metaKey = metaKey || parts.includes('ctrlmeta')
			altKey = altKey || parts.includes('ctrlalt')
		} else
			ctrlKey = ctrlKey || parts.includes('ctrlmeta') || parts.includes('ctrlalt')

		const keybind = {
			key: parts
				.filter(k => !['ctrl', 'meta', 'shift', 'alt', 'ctrlmeta', 'ctrlalt'].includes(k))
				.map(k => k === 'space' ? ' ' : k)
				.join(),
			ctrlKey,
			metaKey,
			altKey,
			shiftKey: parts.includes('shift'),
			handler
		}

		return keybind
	})

	useEventListener('keydown', (event: KeyboardEvent) => {
		if (event.repeat || usingInput())
			return

		for (const keybind of compiledKeymap) {
			if (
				event.key.toLowerCase() !== keybind.key
				|| event.ctrlKey !== keybind.ctrlKey
				|| event.metaKey !== keybind.metaKey
				|| event.shiftKey !== keybind.shiftKey
				|| event.altKey !== keybind.altKey
			)
				continue

			event.preventDefault()
			keybind.handler(event)
		}
	})
}

export function useArrowKeys() {
	const arrowKeys = reactive({
		left: false,
		right: false,
		up: false,
		down: false
	})

	useEventListener(['keydown', 'keyup'], (event: KeyboardEvent) => {
		const key = event.key.toLowerCase()
		const direction = key.substring(5)

		if (!key.includes('arrow') || usingInput())
			return

		arrowKeys[direction as keyof typeof arrowKeys] = event.type === 'keydown'
	})

	return arrowKeys
}
