<script setup lang="ts">
import { useToaster } from './composables/toaster'
import { useEventListener } from '@vueuse/core'
import Board from './components/Board.vue'
import Toaster from './components/Toaster.vue'

const { toast, untoast } = useToaster()
let offlineToast: Toast

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
		<Toaster />
	</main>
</template>
