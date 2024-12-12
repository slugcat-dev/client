import { createGlobalState } from '@vueuse/core'
import { useWebSocket } from './websocket'
import { logBadge } from '../utils'

const apiURL = import.meta.env.APP_API_URL

export const useGateway = createGlobalState(() => {
	const gateway = useWebSocket(apiURL, {
		onConnected: () => {
			console.log('%cGATEWAY', logBadge('#7ee787'), 'Connected')
		},
		onMessage: handleMessage
	})
	const messageCallbacks = new Set<(data: any) => void>()

	function handleMessage(socket: WebSocket, event: MessageEvent) {
		try {
			const data = JSON.parse(event.data)

			if (data.type === 'pong')
				return

			messageCallbacks.forEach(callback => callback(data))
		} catch {}
	}

	function onMessage(callback: (data: any) => void) {
		messageCallbacks.add(callback)
	}

	function cleanupOnMessage(callback: (data: any) => void) {
		messageCallbacks.delete(callback)
	}

	return { gateway, onMessage, cleanupOnMessage }
})
