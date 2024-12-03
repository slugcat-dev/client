<script setup lang="ts">
import { useSettings } from './composables/settings'
import { RouterView } from 'vue-router'
import { watch } from 'vue'
import Toaster from './components/Toaster.vue'

const root = document.documentElement
const settings = useSettings()

watch(settings, () => {
	root.style.colorScheme = settings.colorTheme === 'system' ? 'light dark' : settings.colorTheme
	root.style.setProperty('--color-accent', `var(--color-${settings.colorAccent})`)
}, { immediate: true })
</script>

<template>
	<main>
		<RouterView v-slot="{ Component }">
			<component :is="Component" :key="$route" />
		</RouterView>
		<Toaster />
	</main>
</template>
