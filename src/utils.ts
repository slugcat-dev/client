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

/**
 * Select the specified range.
 */
export function selectRange(range: Range) {
	const selection = document.getSelection()

	if (selection) {
		selection.removeAllRanges()
		selection.addRange(range)
	}
}

/**
 * Get the caret range at the specified coordinates.
 */
export function caretRangeFromPoint(x: number, y: number) {
	if (isFirefox) {
		const caretPos = document.caretPositionFromPoint(x, y)
		const range = document.createRange()

		if (caretPos) {
			range.setStart(caretPos.offsetNode, caretPos.offset)
			range.collapse(true)
		}

		return range
	}

	return document.caretRangeFromPoint(x, y) ?? document.createRange()
}

/**
 * Detect if a wheel event comes from a trackpad.
 */
export function isTrackpad(event: WheelEvent & { wheelDeltaX?: number, wheelDeltaY?: number }) {
	if (event.deltaMode !== event.DOM_DELTA_PIXEL)
		return false

	// See https://stackoverflow.com/q/10744645/13505160
	return (
		(event.wheelDeltaX && event.wheelDeltaX !== 0 && Math.abs(event.wheelDeltaX) !== 120)
		|| (event.wheelDeltaY && event.wheelDeltaY !== 0 && Math.abs(event.wheelDeltaY) !== 120)
		|| (event.wheelDeltaX && event.wheelDeltaY && event.wheelDeltaX === -3 * event.deltaX && event.wheelDeltaY === -3 * event.deltaY)
	)
}
