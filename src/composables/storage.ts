import { openDB } from 'idb'
import { clone, logBadge } from '../utils'
import { createGlobalState, SerializerAsync, useStorageAsync } from '@vueuse/core'
import { reactive, ref, watch } from 'vue'

const loading = ref(new Set<string>())
const idb = await openDB('storage', 1, {
	upgrade: db => db.createObjectStore('data')
})
const idbStorage = {
	getItem: async (key: string) => {
		const value = await idb.get('data', key)

		if (loading.value.size)
			loading.value.delete(key)

		return value
	},
	setItem: async (key: string, value: any) => {
		await idb.put('data', clone(value), key)
	},
	removeItem: async (key: string) => {
		await idb.delete('data', key)
	}
}

function createStorage<T>(name: string, defaultValue: T) {
	loading.value.add(name)

	return useStorageAsync(name, defaultValue, idbStorage, {
		mergeDefaults: true,
		serializer: {
			read: (v: any) => v ?? null,
			write: (v: any) => v,
		} as SerializerAsync<T>
	})
}

export const useStorage = createGlobalState(async () => {
	const storage = reactive({
		user: createStorage('user', null as User | null),
		token: createStorage('token', null as string | null),
		boards: createStorage('boards', [] as Board[]),
	})

	await new Promise<void>(resolve => {
		const unwatch = watch(loading, () => {
			if (loading.value.size)
				return

			console.log('%cSTORAGE', logBadge('#d2a8ff'), 'Loaded')

			unwatch()
			resolve()
		}, { deep: true })
	})

	return storage
})
