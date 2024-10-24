import type { Editor } from '@slugcat-dev/mark-ed'
import { isAndroid, isFirefox } from './utils'
import { isIOS } from '@vueuse/core'

/**
 * Move selected lines up or down.
 */
export function moveLine(editor: Editor, up: boolean): void {
	const selection = editor.selection
	const startLine = editor.lineAt(selection.start)
	const endLine = editor.lineAt(selection.end)

	// Dont move the first line up or the last line down
	if (up) {
		if (startLine.num === 0)
			return
	} else if (endLine.num === editor.lines.length - 1)
		return

	// Move selected lines
	const lineBefore = editor.line(up ? startLine.num - 1 : endLine.num + 1)
	const linesToMove = editor.lines.slice(startLine.num, endLine.num + 1)

	editor.lines.splice(startLine.num, linesToMove.length)
	editor.lines.splice(startLine.num - (up ? 1 : -1), 0, ...linesToMove)

	// Also move the selection
	const start = up
		? lineBefore.from + (selection.start - startLine.from)
		: lineBefore.text.length + selection.start + 1
	const end = start + (selection.end - selection.start)

	editor.updateDOM({ start, end })
}

/**
 * Add a smooth animated caret.
 */
export function smoothCaret(editor: Editor, caret: HTMLElement) {
	// Don't apply on mobile devices
	if (isAndroid || isIOS)
		return

	editor.root.style.caretColor = 'transparent'

	editor.addEventListener('selectionchange', () => {
		const selection = document.getSelection()
		let caretVisible = false

		// Calculate the caret position
		if (editor.focused && selection && selection.focusNode) {
			const range = document.createRange()
			const focusNode = selection.focusNode

			range.setStart(focusNode, selection.focusOffset)
			range.collapse(true)

			const rangeRect = range.getBoundingClientRect()
			const caretRect = DOMRect.fromRect(rangeRect)
			const editorRect = editor.root.getBoundingClientRect()

			// Fix for empty lines
			if (focusNode instanceof HTMLElement) {
				let innermostChild = focusNode

				while (innermostChild.firstChild instanceof HTMLElement)
					innermostChild = innermostChild.firstChild

				const rect = innermostChild.getBoundingClientRect()
				const computedStyle = getComputedStyle(innermostChild)
				const fontSize = parseFloat(computedStyle.fontSize)
				const caretHeight = rect.height - fontSize * 1.125

				caretRect.x = rect.x + parseFloat(computedStyle.paddingInlineStart)
				caretRect.y = rect.y + caretHeight / 2
				caretRect.height = rect.height - caretHeight
			}

			const x = Math.round(caretRect.left - editorRect.left)
			const y = Math.round(caretRect.top - editorRect.top)

			caret.style.height = `${caretRect.height}px`
			caret.style.translate = `${x}px ${y}px`

			// Sry Firefox <3
			if (!isFirefox || selection.isCollapsed)
				caretVisible = true
		}

		// Hide the caret if the editor is not focused
		caret.classList.toggle('visible', caretVisible)

		// Restart the caret blink animation
		if (caret.style.animationName === 'blink-1')
			caret.style.animationName = 'blink-2'
		else
			caret.style.animationName = 'blink-1'
	})
}
