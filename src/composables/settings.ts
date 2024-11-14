import { createGlobalState, useStorage } from '@vueuse/core'
import { reactive, ref } from 'vue'

export const useSettings = createGlobalState(() => {
	const settings = reactive(useStorage('settings', {
		colorTheme: 'system',
		colorAccent: 'blue',
		fontContent: 'Roboto',
		fontMonospace: 'Fira Code',
		boardBackground: 'dot',
		doubleClickCreateCard: true,
		typeAnywhere: true,
		selectionMode: 'draw',
		snap: 'cards'
	}, localStorage, { mergeDefaults: true }).value)
	const settingsVisible = ref(false)

	return { settings, settingsVisible }
})
