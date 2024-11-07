import { createGlobalState, useStorage } from '@vueuse/core'
import { reactive, ref } from 'vue'

export const useSettings = createGlobalState(() => {
	const settings = reactive(useStorage('settings', {
		colorTheme: 'system',
		colorAccent: 'blue',
		fontContent: 'Roboto',
		fontMonospace: 'JetBrains Mono',
		boardBackground: 'dot',
		doubleClickCreateCard: true,
		typeAnywhere: true,
		selectionMode: 'draw'
	}, localStorage, { mergeDefaults: true }).value)
	const settingsVisible = ref(false)

	return { settings, settingsVisible }
})
