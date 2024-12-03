import { useCache } from './composables/cache'
import { useAppState } from './composables/appState'
import { ofetch } from 'ofetch'
import { logBadge } from './utils'

const apiURL = import.meta.env.APP_API_URL
const cache = useCache()
const appState = useAppState()

export async function loginUser() {
	console.log('%cAUTH', logBadge('#f2cc60'), 'Validating token...')

	const token = localStorage.getItem('token')

	try {
		const user = await ofetch(`${apiURL}/user/me`, {
			headers: {
				'Authorization': `Bearer ${token}`
			}
		})

		cache.user = {
			id: Number(user.id),
			email: user.email,
			created: user.created
		}
		appState.loggedIn = true

		return true
	} catch {
		cache.user = null

		localStorage.removeItem('token')

		return false
	}
}
