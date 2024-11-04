<script setup lang="ts">
import { useSettings } from './composables/settings'
import { useToaster } from './composables/toaster'
import { watch } from 'vue'
import { useEventListener } from '@vueuse/core'
import Board from './components/Board.vue'
import Settings from './components/Settings.vue'
import Toaster from './components/Toaster.vue'

const { settings } = useSettings()
const { toast, untoast } = useToaster()
let offlineToast: Toast

// Update settings
watch(settings, () => {
	const rootStyle = document.documentElement.style

	rootStyle.setProperty('--color-accent', `var(--color-${settings.colorAccent})`)
	rootStyle.setProperty('--font-content', `'${settings.fontContent || 'sans-serif'}', sans-serif`)
	rootStyle.setProperty('--font-monospace', `'${settings.fontMonospace || 'monospace'}', monospace`)
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
