<script setup lang="ts">
import { useAppState } from './composables/appState'
import { useToaster } from './composables/toaster'
import { RouterView, useRouter } from 'vue-router'
import { useSettings } from './composables/settings'
import { useEventListener } from '@vueuse/core'
import { logBadge } from './utils'
import { watch, watchEffect } from 'vue'
import { loginUser } from './user'
import Toaster from './components/Toaster.vue'

const root = document.documentElement
const appState = useAppState()
const { toast, untoast } = useToaster()
const router = useRouter()
const settings = useSettings()
let offlineToast: Toast | undefined

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
		if (offlineToast) {
			untoast(offlineToast)
			toast('Back online')

			offlineToast = undefined
		}
	} else
		offlineToast = toast('Offline, some features are not available', 'red', true)
})

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
			console.log('%cAUTH', logBadge('#f2cc60'), 'Assuming valid token')
	})
}

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
