export const isFirefox = /Firefox/i.test(navigator.userAgent)
export const isAndroid = /Android/i.test(navigator.userAgent)
export const isMac = /Mac/i.test(navigator.platform)
export const isIOS = isMac && 'ontouchstart' in window
export const isPointerCoarse = window.matchMedia('(pointer: coarse)').matches

/**
 * Check if the pointer was moved by at least the specified amount of pixels.
 */
export function moveThreshold(start: Pos, current: Pos, threshold: number) {
	const dX = Math.abs(start.x - current.x)
	const dY = Math.abs(start.y - current.y)

	return dX >= threshold || dY >= threshold
}

/**
 * Suppress the next click event.
 */
export function suppressClick() {
	document.addEventListener('click', function suppressEvent(event: MouseEvent) {
		document.removeEventListener('click', suppressEvent, true)
		event.preventDefault()
		event.stopPropagation()
	}, true)
}
