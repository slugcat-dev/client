import { createApp, watchEffect } from 'vue'
import { useAppState } from './composables/appState'
import { createRouter, createWebHistory } from 'vue-router'
import { useToaster } from './composables/toaster'
import { loginUser } from './user'
import App from './App.vue'
import Board from './views/Board.vue'
import Login from './views/Login.vue'
import Settings from './views/Settings.vue'

const base = import.meta.env.APP_BASE_PATH
const app = createApp(App)
const appState = useAppState()
const router = createRouter({
	history: createWebHistory(base),
	routes: [
		{ path: '/', component: Board },
		{ path: '/login', component: Login },
		{ path: '/settings', component: Settings },
		{ path: '/:board', component: Board }
	]
})
const { toast, untoast } = useToaster()
let offlineToast: Toast

window.addEventListener('offline', setOffline)

window.addEventListener('online', () => {
	appState.online = true

	untoast(offlineToast)
	toast('Back online')
})

window.addEventListener('beforeunload', (event: Event) => {
	if (appState.pendingWork.size)
		event.preventDefault()
})

if (navigator.onLine)
	appState.online = true
else
	setOffline()

watchEffect(() => {
	if (appState.online)
		loginUser()
})

function setOffline() {
	appState.online = false
	offlineToast = toast('Offline, some features are not available', 'red', true)
}

app.use(router).mount('#app')
