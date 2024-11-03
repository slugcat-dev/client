import { createGlobalState } from '@vueuse/core'
import { ref } from 'vue'

export const useToaster = createGlobalState(() => {
	const toasts = ref<Toast[]>([])

	function toast(message: string, color: Toast['color'] = 'green', persistent = false) {
		const id = Date.now()
		const toast = {
			id,
			message,
			color,
			persistent,
			timeout: setTimeout(() => persistent ? null : untoast(toast), 5000)
		}

		toasts.value.push(toast)

		return toast
	}

	function untoast(toast: Toast) {
		clearTimeout(toast.timeout)
		toasts.value.splice(toasts.value.findIndex(t => t.id === toast.id), 1)
	}

	return { toasts, toast, untoast }
})
