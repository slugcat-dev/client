import { createRouter, createWebHistory } from 'vue-router'
import { loginUser } from './user'
import Login from './views/Login.vue'
import Settings from './views/Settings.vue'
import Board from './views/Board.vue'

const base = import.meta.env.APP_BASE_PATH

export const router = createRouter({
	history: createWebHistory(base),
	routes: [
		{
			path: '/',
			component: Settings
			/*
			TODO

				- First visit? -> Demo board
				- -> Most recent or default board
			*/
		},
		{
			path: '/login',
			name: 'login',
			component: Login,
			beforeEnter: async () => {
				if (localStorage.getItem('token') && await loginUser())
					return '/'
			}
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
