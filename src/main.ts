
// Import stylesheets
import './assets/style.css'
import './assets/mark-ed.css'
import './assets/hljs.css'

// Create Vue app
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
