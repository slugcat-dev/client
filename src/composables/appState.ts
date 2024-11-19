import { createGlobalState } from '@vueuse/core'
import { reactive } from 'vue'

export const useAppState = createGlobalState(() => {
	const state = reactive({
		pendingWork: new Set(),
		settingsOpen: false
	})

	return state
})
