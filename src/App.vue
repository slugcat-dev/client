<script setup lang="ts">
import { useAppState } from './composables/appState'
import { useRouter } from 'vue-router'
import { useToaster } from './composables/toaster'
import { useGateway } from './composables/gateway'
import { useSettings } from './composables/settings'
import { onMounted, onUnmounted, watch, watchEffect, type WatchHandle } from 'vue'
import { useStorage } from './composables/storage'
import { loginUser } from './user'
import { logBadge, pluralize } from './utils'
import { useDebounceFn, useEventListener } from '@vueuse/core'
import { ofetch } from 'ofetch'
import { fetchBoards } from './composables/board'
import Toaster from './components/Toaster.vue'

const apiURL = import.meta.env.APP_API_URL
const root = document.documentElement
const appState = useAppState()
const router = useRouter()
const { toast, untoast } = useToaster()
const { gateway } = useGateway()
const settings = useSettings()
let unwatchSync: WatchHandle
let unwatchFetchBoards: WatchHandle
let offlineToast: Toast | undefined

onMounted(async () => {
	const storage = await useStorage()

	// Check if the auth token is still valid
	if (appState.loggedIn) {
		const unwatch = watchEffect(async () => {
			if (appState.online) {
				const valid = await loginUser()

				if (valid)
					unwatch()
				else
					router.push('/login')
			} else
				console.warn('%cAUTH', logBadge('#f2cc60'), 'Assuming valid token')
		})
	}

	// Sync boards and cards with the server
	const sync = useDebounceFn(async () => {
		const result = await ofetch(`${apiURL}/sync`, {
			method: 'POST',
			body: storage.queue,
			headers: {
				'Authorization': `Bearer ${storage.token}`
			}
		})
		const failed = result.boards.length + result.cards.length

		if (failed)
			console.error('%cSYNC', logBadge('#79c0ff'), `${pluralize('operation', failed)} failed`, result.boards, result.cards)

		storage.queue = { cards: [], boards: [] }
	}, 500)

	unwatchSync = watchEffect(() => {
		const operations = storage.queue.boards.length + storage.queue.cards.length

		if (appState.loggedIn && appState.online && operations)
			sync()
	})

	// Download boards from the server
	unwatchFetchBoards = watch(() => appState.loggedIn && appState.online, online => {
		if (online)
			fetchBoards()
	}, { immediate: true })
})

onUnmounted(() => {
	unwatchSync()
	unwatchFetchBoards()
})

// Show a warning when the user closes the window while having unsaved work
useEventListener(window, 'beforeunload', (event: Event) => {
	if (appState.pendingWork.size)
		event.preventDefault()
})

useEventListener(window, 'offline', () => {
	console.log('%cOFFLINE', logBadge('#ff7b72'))

	appState.online = false
})

useEventListener(window, 'online', () => {
	console.log('%cONLINE', logBadge('#7ee787'))

	appState.online = true
})

// Offline notification
watchEffect(() => {
	if (appState.online) {
		gateway.open()

		if (offlineToast) {
			untoast(offlineToast)
			toast('Back online')

			offlineToast = undefined
		}
	} else {
		gateway.close()

		offlineToast = toast('Offline, some features are not available', 'red', true)
	}
})

watch(settings, () => {
	root.style.colorScheme = settings.colorTheme === 'system' ? 'light dark' : settings.colorTheme
	root.style.setProperty('--color-accent', `var(--color-${settings.colorAccent})`)
}, { immediate: true })
</script>

<template>
	<Suspense>
		<main>
			<RouterView v-slot="{ Component }">
				<component :is="Component" :key="$route" />
			</RouterView>
			<Toaster />
		</main>
	</Suspense>
</template>
