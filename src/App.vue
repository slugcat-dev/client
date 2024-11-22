<script setup lang="ts">
import { useSettings } from './composables/settings'
import { useAppState } from './composables/appState'
import { useToaster } from './composables/toaster'
import { watch } from 'vue'
import { useEventListener } from '@vueuse/core'
import Board from './components/Board.vue'
import Settings from './components/Settings.vue'
import Toaster from './components/Toaster.vue'

const settings = useSettings()
const appState = useAppState()
const { toast, untoast } = useToaster()
const root = document.documentElement
let offlineToast: Toast

watch(settings, () => {
	root.style.colorScheme = settings.colorTheme === 'system' ? 'light dark' : settings.colorTheme
	root.style.setProperty('--color-accent', `var(--color-${settings.colorAccent})`)
}, { immediate: true })

useEventListener('offline', () => {
	appState.online = false
	offlineToast = toast('Offline, some features are not available', 'red', true)
})

useEventListener('online', () => {
	appState.online = true

	untoast(offlineToast)
	toast('Back online')
})
</script>

<template>
	<main>
		<Board />
		<Settings />
		<Toaster />
	</main>
</template>
