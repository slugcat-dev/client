import { tryOnScopeDispose, useEventListener, useIntervalFn } from '@vueuse/core'
import { ref } from 'vue'

export interface UseWebSocketOptions {
	onConnected?: (socket: WebSocket) => void
	onDisconnected?: (socket: WebSocket, event: CloseEvent) => void
	onMessage?: (socket: WebSocket, event: MessageEvent) => void
}

export function useWebSocket(url: string, options: UseWebSocketOptions = {}) {
	const socket = ref<WebSocket | undefined>()
	const connected = ref(false)
	let explicitlyClosed = false
	let buffer: any[] = []

	const { pause: pauseHeartbeat, resume: resumeHeartbeat } = useIntervalFn(() => {
		send({ type: 'ping' }, false)
	}, 10000, { immediate: false })

	function init() {
		connected.value = false

		if (explicitlyClosed)
			return

		const ws = new WebSocket(url)

		ws.addEventListener('open', () => {
			connected.value = true

			options.onConnected?.(ws)
			resumeHeartbeat()

			if (buffer.length)
				buffer.forEach(data => send(data))

			buffer = []
		})

		ws.addEventListener('close', event => {
			connected.value = false

			options.onDisconnected?.(ws, event)

			// Try to automatically reconnect
			if (!explicitlyClosed && (!socket.value || ws === socket.value))
				setTimeout(init, 1000)
		})

		ws.addEventListener('message', event => {
			options.onMessage?.(ws, event)
		})

		socket.value = ws
	}

	function open() {
		close()

		explicitlyClosed = false

		init()
	}

	function close() {
		explicitlyClosed = true

		pauseHeartbeat()

		if (socket.value)
			socket.value.close()

		socket.value = undefined
	}

	function send(data: any, useBuffer = true) {
		// If the socket is not connected, add the data to the buffer to send later
		if (!socket.value || !connected.value) {
			if (useBuffer)
				buffer.push(data)

			return false
		}

		socket.value.send(JSON.stringify(data))

		return true
	}

	// Automatically close the connection gracefully
	useEventListener('beforeunload', () => close())
	tryOnScopeDispose(close)

	return {
		socket,
		connected,
		open,
		close,
		send
	}
}
