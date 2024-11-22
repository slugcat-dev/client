import { type MaybeRefOrGetter, watch } from 'vue'

export const isFirefox = /Firefox/i.test(navigator.userAgent)
export const isAndroid = /Android/i.test(navigator.userAgent)
export const isMac = /Mac/i.test(navigator.platform) || /iPhone/.test(navigator.userAgent)
export const isIOS = isMac && 'ontouchstart' in window
export const isMobile = isAndroid || isIOS
export const isDesktop = !isMobile
export const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function isPointerCoarse() {
	return window.matchMedia('(pointer: coarse)').matches
}

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
	document.addEventListener('click', function suppress(event: Event) {
		event.stopPropagation()
		event.preventDefault()
		document.removeEventListener('click', suppress, { capture: true })
	}, { capture: true })
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
	/* if (event.deltaMode !== event.DOM_DELTA_PIXEL)
		return false */

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

	if (activeElement === document.body)
		return false

	if (activeElement) {
		const contentEditable = activeElement.getAttribute('contenteditable') ?? 'false'

		return (
			activeElement instanceof HTMLButtonElement
			|| activeElement instanceof HTMLInputElement
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
 * Check if a string is an URL.
 */
export function isURL(string: string) {
	try {
		return new URL(string)
	} catch {}

	return false
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

/**
 * Encode a file into a Base64 string.
 */
export function fileToBase64(file: File) {
	return new Promise<string>((resolve, reject) => {
			const reader = new FileReader()

			reader.addEventListener('loadend', () => resolve(reader.result as string))
			reader.addEventListener('error', () => reject(new Error('File could not be read')))
			reader.readAsDataURL(file)
	})
}

/**
 * Convert a Base64 string to a file.
 */
export function base64ToFile(base64: string, name: string, type: string) {
	const data = atob(base64.split(',')[1])
	const buffer = new Uint8Array(data.length)

	for (let i = 0; i < data.length; i++)
		buffer[i] = data.charCodeAt(i)

	const blob = new Blob([buffer], { type })
	const file = new File([blob], name, { type })

	return file
}

/**
 * Check if a string is a valid CSS color.
 */
export function isValidColor(color: string) {
	return CSS.supports('color', color)
}

/**
 * Limit width and height of, for example, an image while maintaining the aspect ratio.
 */
export function limitSize(width: number, height: number, min: number, max: number) {
	const aspectRatio = width / height

	if (width > min && height > min) {
		if (aspectRatio > 1) {
			width = Math.min(width, max)
			height = width / aspectRatio
		} else {
			height = Math.min(height, max)
			width = height * aspectRatio
		}
	}

	return [width, height]
}
