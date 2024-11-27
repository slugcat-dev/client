import { createGlobalState } from '@vueuse/core'
import { reactive } from 'vue'

export const useAppState = createGlobalState(() => {
	const state = reactive({
		online: true,
		pendingWork: new Set()
	})

	return state
})
