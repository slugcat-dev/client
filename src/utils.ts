import { type MaybeRefOrGetter, watch } from 'vue'

export const isFirefox = /Firefox/i.test(navigator.userAgent)
export const isAndroid = /Android/i.test(navigator.userAgent)
export const isMac = /Mac/i.test(navigator.platform)
export const isIOS = isMac && 'ontouchstart' in window
export const isPointerCoarse = window.matchMedia('(pointer: coarse)').matches
export const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function clamp(value: number, min: number, max: number) {
	return Math.max(Math.min(value, max), min)
}

/**
 * Wait for a value to change before executing a function.
 */
export function onceChanged(source: MaybeRefOrGetter, callback: Function) {
	watch(source, () => callback(), { once: true })
}

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

/**
 * Check if the active element is an input.
 */
export function usingInput() {
	const activeElement = document.activeElement

	if (activeElement) {
		const contentEditable = activeElement.getAttribute('contenteditable') ?? 'false'

		return (
			activeElement instanceof HTMLInputElement
			|| activeElement instanceof HTMLTextAreaElement
			|| contentEditable !== 'false'
		)
	}

	return false
}

/**
 * Calculate the midpoint between given points.
 */
export function midpoint(positions: Pos[]) {
	const sum = positions.reduce((acc, pos) => ({
		x: acc.x + pos.x,
		y: acc.y + pos.y
	}))

	return {
		x: sum.x / positions.length,
		y: sum.y / positions.length
	}
}

/**
 * Calculate the distance between given points.
 */
export function distance(positions: Pos[]) {
	const mid = midpoint(positions)
	const sum = positions.reduce((_, pos) => Math.hypot(
		pos.x - mid.x,
		pos.y - mid.y
	), 0)

	return sum / positions.length
}

/**
 * Check if two rects overlap.
 */
export function rectsOverlap(a: DOMRect, b: DOMRect) {
	return !(
		a.left > b.right
		|| a.right < b.left
		|| a.top > b.bottom
		|| a.bottom < b.top
	)
}

/**
 * Check if a rect completely contains another rect.
 */
export function rectContains(a: DOMRect, b: DOMRect) {
	return (
		a.left <= b.left
		&& a.right >= b.right
		&& a.top <= b.top
		&& a.bottom >= b.bottom
	)
}

/**
 * Load an image from a given source URL.
 *
 * @returns A Promise that resolves with a loaded `HTMLImageElement`.
 */
export function loadImage(src: string) {
	return new Promise<HTMLImageElement>((resolve, reject) => {
		const img = new Image()

		img.addEventListener('load', () => resolve(img))
		img.addEventListener('error', reject)

		img.src = src
	})
}
