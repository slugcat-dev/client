import { useCache } from './composables/cache'
import { ofetch } from 'ofetch'

const apiURL = import.meta.env.APP_API_URL
const cache = useCache()

export async function loginUser() {
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
	} catch {
		cache.user = null

		localStorage.removeItem('token')
	}
}
