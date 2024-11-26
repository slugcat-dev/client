import { createApp } from 'vue'
import { useAppState } from './composables/appState'
import App from './App.vue'

const app = createApp(App)
const appState = useAppState()

window.addEventListener('beforeunload', (event: Event) => {
	if (appState.pendingWork.size)
		event.preventDefault()
})

app.mount('#app')
