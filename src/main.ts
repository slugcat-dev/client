import { createApp } from 'vue'
import { useAppState } from './composables/appState'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Index from './views/Index.vue'
import Board from './views/Board.vue'
import Settings from './views/Settings.vue'

const base = import.meta.env.APP_BASE_PATH
const app = createApp(App)
const appState = useAppState()
const router = createRouter({
	history: createWebHistory(base),
	routes: [
		{ path: '/', component: Index },
		{ path: '/:board', component: Board },
		{ path: '/settings', component: Settings }
	]
})

window.addEventListener('beforeunload', (event: Event) => {
	if (appState.pendingWork.size)
		event.preventDefault()
})

app.use(router).mount('#app')
