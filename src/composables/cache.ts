import { createGlobalState, useStorage } from '@vueuse/core'
import { reactive } from 'vue'

export const useCache = createGlobalState(() => {
	const cache = reactive(useStorage('data', {
		user: null as null | User,
		boards: [] as Board[]
	}, localStorage, { mergeDefaults: true }).value)

	return cache
})
