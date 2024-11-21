import { createGlobalState, useStorage } from '@vueuse/core'
import { reactive } from 'vue'

export const useSettings = createGlobalState(() => {
	const settings = reactive(useStorage('settings', {
		colorTheme: 'system',
		colorAccent: 'blue',
		boardBackground: 'dot',
		doubleClickCreateCard: true,
		typeAnywhere: true,
		selectionMode: 'draw',
		snap: 'cards'
	}, localStorage, { mergeDefaults: true }).value)

	return settings
})
