import { useStorage } from './storage'
import { createGlobalState } from '@vueuse/core'
import { reactive } from 'vue'

const storage = await useStorage()

export const useAppState = createGlobalState(() => {
	const state = reactive({
		online: navigator.onLine,
		loggedIn: !!(storage.token && storage.user),
		pendingWork: new Set()
	})

	return state
})
