import { Editor, type Match } from '@slugcat-dev/mark-ed'
import { caretRangeFromPoint, isAndroid, isFirefox, isIOS, isPointerCoarse, selectRange } from './utils'
import hljs from 'highlight.js'

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

export function moveCaretWhereClicked(editor: Editor, event: MouseEvent | MouseEvent & { rangeOffset: number, rangeParent: Node }) {
	const caretRange = caretRangeFromPoint(event.clientX, event.clientY)

	// Move the caret to the next word boundary
	if (isPointerCoarse) {
		const text = caretRange.startContainer.textContent ?? ''
		let start = caretRange.startOffset
		let end = caretRange.startOffset

		while (start > 0 && !/\s|\W/.test(text.charAt(start - 1)))
			start--

		while (end < text.length && !/\s|\W/.test(text.charAt(end)))
			end++

		caretRange.setStart(caretRange.startContainer, end - caretRange.startOffset <= caretRange.startOffset - start ? end : start)
		caretRange.collapse(true)
	}

	selectRange(caretRange)

	// Force a selection update after moving the caret
	editor.setSelection(editor.getSelection())
}

/**
 * Toggle TaskList checkboxes.
 */
export function toggleCheckbox(editor: Editor, event: Event) {
	if (!(event.target instanceof HTMLInputElement && event.target.matches('.md-task input[type="checkbox"]')))
		return

	const checkboxPos = editor.getNodeOffset(event.target)
	const line = editor.lineAt(checkboxPos)
	const pos = checkboxPos - line.from + 3
	const text = line.text

	editor.lines[line.num] = text.substring(0, pos)
		+ (text[pos] === ' ' ? 'x' : ' ')
		+ text.substring(pos + 1)

	editor.updateDOM(Editor.selectionFrom(line.end))
}

/**
 * Add a smooth animated caret.
 */
export function smoothCaretAddon(editor: Editor, caret: HTMLElement, canvas: Canvas) {
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
				const caretHeight = rect.height - fontSize * 1.125 * canvas.zoom

				caretRect.x = rect.x + parseFloat(computedStyle.paddingInlineStart)
				caretRect.y = rect.y + caretHeight / 2
				caretRect.height = rect.height - caretHeight
			}

			const x = Math.round(caretRect.left - editorRect.left)
			const y = Math.round(caretRect.top - editorRect.top)

			caret.style.height = `${caretRect.height / canvas.zoom}px`
			caret.style.translate = `${x / canvas.zoom}px ${y / canvas.zoom}px`

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

/**
 * Highlight fenced code blocks.
 */
export function highlightCodeAddon(editor: Editor) {
	editor.addEventListener('change', onChange)
	onChange()

	function onChange() {
		if (!editor.markdown.lineTypes.some(type => type === 'CodeBlock'))
			return

		const selection = editor.getSelection()
		let inCodeBlock = false
		let start = 0
		let mark = '```'
		let language = 'plaintext'
		let code = []

		// Collect code blocks in the editor
		for (let lineNum = 0; lineNum < editor.lines.length; lineNum++) {
			const type = editor.markdown.lineTypes[lineNum]
			const line = editor.lines[lineNum]

			if (inCodeBlock) {
				const isClosingLine = RegExp(`^(\\s*)(\`{${mark.length},})(\\s*)$`).test(line)

				if (type === 'CodeBlock' && !isClosingLine)
					code.push(line)

				if (type !== 'CodeBlock' || isClosingLine || lineNum === editor.lines.length - 1) {
					// Highlight the code block
					highlightCode(code, start, language, isClosingLine)

					inCodeBlock = false
					code = []
				}
			} else if (type === 'CodeBlock') {
				const openMatch = /^([\t ]*)(`{3,})(\s*)([^\s`]*)([^`]*)$/.exec(line)!
				const codeLangElm = editor.root.children[lineNum].querySelector('.md-code-lang')

				inCodeBlock = true
				start = lineNum + 1
				mark = openMatch[2]
				language = hljs.getLanguage(openMatch[4]) ? openMatch[4] : 'plaintext'

				// Make the language label red if the language is not supported
				if (codeLangElm && language !== openMatch[4])
					(codeLangElm as HTMLElement).style.color = 'var(--color-red)'
			}
		}

		// Reposition the caret
		editor.setSelection(selection)
	}

	function highlightCode(code: string[], start: number, language: string, isClosingLine: boolean) {
		if (!code.length)
			return

		// Remove the old code lines
		for (let i = start; i < start + code.length; i++)
			editor.root.children[start].remove()

		const highlighted = hljs.highlight(code.join('\n'), { language, ignoreIllegals: true }).value

		// Insert the highlighted code lines
		fixMultilineTags(highlighted).split('\n').reverse().forEach((line, i) => {
			const lineElm = document.createElement('div')

			lineElm.className = 'md-line'
			lineElm.innerHTML = `<code class="md-code-block${isClosingLine || i ? '' : ' md-close'}">${line}</code>`

			// Fix empty lines
			if (lineElm.firstChild!.textContent!.length === 0)
				(lineElm.firstChild as Element).innerHTML = '<br>'

			editor.root.insertBefore(lineElm, editor.root.children[start])
		})
	}

	// This function fixes inline elements containing line breaks generated by highlight.js
	// <span>This has\na line break</span> will become <span>This has</span>\n<span>a line break</span>
	function fixMultilineTags(html: string) {
		const code = document.createElement('div')
		const result = document.createElement('div')

		code.innerHTML = html

		function walkAndSplit(node: Node, parent: Element | null) {
			if (node.nodeType === Node.TEXT_NODE) {
				const textParts = node.textContent!.split('\n')

				textParts.forEach((part, i) => {
					if (part) {
						if (parent) {
							const wrapper = document.createElement(parent.tagName)

							wrapper.className = parent.className
							wrapper.textContent = part

							result.appendChild(wrapper)
						} else
							result.appendChild(document.createTextNode(part))
					}

					if (i < textParts.length - 1)
						result.appendChild(document.createTextNode('\n'))
				})
			} else if (node.nodeType === Node.ELEMENT_NODE)
				node.childNodes.forEach(child => walkAndSplit(child, node as Element))
		}

		code.childNodes.forEach(child => walkAndSplit(child, null))

		return result.innerHTML
	}
}
