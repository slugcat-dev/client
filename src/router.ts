import { createRouter, createWebHistory } from 'vue-router'
import BoardList from './views/BoardList.vue'
import Login from './views/Login.vue'
import Settings from './views/Settings.vue'
import Board from './views/Board.vue'

const base = import.meta.env.APP_BASE_PATH

export const router = createRouter({
	history: createWebHistory(base),
	routes: [
		{
			path: '/',
			component: BoardList
		},
		{
			path: '/login',
			name: 'login',
			component: Login
		},
		{
			path: '/settings',
			name: 'settings',
			component: Settings
		},
		{
			path: '/:board',
			component: Board
		}
	]
})
