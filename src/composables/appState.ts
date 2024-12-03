import { createGlobalState } from '@vueuse/core'
import { reactive } from 'vue'

export const useAppState = createGlobalState(() => {
	const state = reactive({
		online: false,
		loggedIn: false,
		pendingWork: new Set()
	})

	return state
})
