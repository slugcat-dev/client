import { useCache } from './cache'
import { createGlobalState } from '@vueuse/core'
import { reactive } from 'vue'
import { logBadge } from '../utils'

const cache = useCache()

export const useAppState = createGlobalState(() => {
	const state = reactive({
		online: navigator.onLine,
		loggedIn: !!(localStorage.getItem('token') && cache.user),
		pendingWork: new Set()
	})

	if (state.loggedIn && !state.online)
		console.log('%cAUTH', logBadge('#f2cc60'), 'Assuming valid token')

	return state
})
