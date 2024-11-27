import { createGlobalState, useStorage } from '@vueuse/core'
import { reactive } from 'vue'

export const useCache = createGlobalState(() => {
	const cache = reactive(useStorage('data', {
		boards: [] as Board[]
	}, localStorage, { mergeDefaults: true }).value)

	return cache
})
