<script setup lang="ts">
import { useSettings } from './composables/settings'
import { useToaster } from './composables/toaster'
import { watch } from 'vue'
import { useEventListener } from '@vueuse/core'
import Board from './components/Board.vue'
import Settings from './components/Settings.vue'
import Toaster from './components/Toaster.vue'

const settings = useSettings()
const { toast, untoast } = useToaster()
const root = document.documentElement
let offlineToast: Toast

watch(settings, () => {
	root.style.colorScheme = settings.colorTheme === 'system' ? 'light dark' : settings.colorTheme
	root.style.setProperty('--color-accent', `var(--color-${settings.colorAccent})`)
	root.style.setProperty('--font-content', `'${settings.fontContent || 'sans-serif'}', sans-serif`)
	root.style.setProperty('--font-monospace', `'${settings.fontMonospace || 'monospace'}', monospace`)
}, { immediate: true })

useEventListener('offline', () => {
	offlineToast = toast('Offline', 'red', true)
})

useEventListener('online', () => {
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
