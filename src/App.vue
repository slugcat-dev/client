<script setup lang="ts">
import { useSettings } from './composables/settings'
import { useAppState } from './composables/appState'
import { useToaster } from './composables/toaster'
import { RouterView, useRoute } from 'vue-router'
import { computed } from 'vue'
import { watch } from 'vue'
import { useEventListener } from '@vueuse/core'
import Toaster from './components/Toaster.vue'

const root = document.documentElement
const settings = useSettings()
const appState = useAppState()
const { toast, untoast } = useToaster()
const route = useRoute()
const componentKey = computed(() => route.path.includes('/settings') ? 'settings' : route.params.board)
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
		<RouterView v-slot="{ Component }">
			<component :is="Component" :key="componentKey" />
		</RouterView>
		<Toaster />
	</main>
</template>
