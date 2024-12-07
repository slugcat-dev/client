import { useStorage } from './composables/storage'
import { useAppState } from './composables/appState'
import { logBadge } from './utils'
import { ofetch } from 'ofetch'

const apiURL = import.meta.env.APP_API_URL
const storage = await useStorage()
const appState = useAppState()

export async function loginUser() {
	console.log('%cAUTH', logBadge('#f2cc60'), 'Validating token...')

	try {
		const user = await ofetch(`${apiURL}/user/me`, {
			headers: {
				'Authorization': `Bearer ${storage.token}`
			}
		})

		storage.user = {
			id: user.id,
			email: user.email,
			created: user.created
		}
		appState.loggedIn = true

		console.log('%cAUTH', logBadge('#f2cc60'), 'Logged in')

		return true
	} catch {
		console.error('%cAUTH', logBadge('#f2cc60'), 'Invalid token')
		logoutUser()

		return false
	}
}

export function logoutUser() {
	appState.loggedIn = false
	storage.user = null
	storage.token = null

	console.log('%cAUTH', logBadge('#f2cc60'), 'Logged out')
}
