<script setup lang="ts">
import { inject, onBeforeUnmount, onMounted, reactive, toRef, useTemplateRef, watch } from 'vue'
import { Editor } from '@slugcat-dev/mark-ed'
import { highlightCodeAddon, moveCaretWhereClicked, moveLine, smoothCaretAddon, toggleCheckbox } from '../editor'
import { useAppState } from '../composables/appState'
import { useDebounceFn } from '@vueuse/core'
import { prefersReducedMotion } from '../utils'
import { getDataTransferItems } from '../clipboard'

const { card } = defineProps<{ card: Card }>()
const editorRef = useTemplateRef('editor-ref')
const caretRef = useTemplateRef('caret-ref')
const state = reactive({
	active: false,
	deleteIntent: false
})
const canvas = inject('canvas') as CanvasContext
const { deleteCard, updateCard } = inject('board') as BoardContext
const appState = useAppState()
const clearDeleteIntent = useDebounceFn(() => state.deleteIntent = false, 500)
let editor: Editor

onMounted(() => {
	editor = new Editor(editorRef.value!, {
		readonly: true,
		hideMarks: true,
		keymap: {
			'Alt ArrowUp': editor => moveLine(editor, true),
			'Alt ArrowDown': editor => moveLine(editor, false)
		}
	})

	highlightCodeAddon(editor)
	smoothCaretAddon(editor, caretRef.value!, canvas)

	// Prevent links from being dragged instead of the card
	editor.addEventListener('change', () => {
		editor.root.querySelectorAll('a').forEach(a => a.draggable = false)
	})

	editor.content = card.content.text

	if (card.new) {
		activate()

		if (card.content.text !== '')
			editor.setSelection(card.content.text.length)
		else
			editor.setSelection(editor.getSelection())
	}
})

watch(() => card.content.text, () => {
	if (editor.content !== card.content.text)
		editor.content = card.content.text
})

onBeforeUnmount(() => {
	editor.destroy()
})

function onClick(event: MouseEvent) {
	if (state.active || event.target instanceof HTMLAnchorElement)
		return

	activate()

	if (event.target instanceof HTMLInputElement)
		toggleCheckbox(editor, event)
	else
		moveCaretWhereClicked(editor, event)
}

function onKeyDelete(event: KeyboardEvent) {
	if (editor.content !== '' || event.repeat)
		return

	if (state.deleteIntent || prefersReducedMotion)
		return editor.root.blur()

	state.deleteIntent = true

	clearDeleteIntent()
	wiggleAnimation()
}

async function onPaste(event: ClipboardEvent) {
	if (!event.clipboardData)
		return

	const items = await getDataTransferItems(event.clipboardData)
	const textItem = items.find(item => item.type === 'text/plain')

	if (items.some(item => item.type === 'cards'))
		return

	editor.insertAtSelection(textItem?.data ?? '')
}

function onBlur() {
	state.active = false
	editor.readonly = true
	card.content.text = editor.content

	if (card.content.text === '')
		deleteCard(card)
	else
		updateCard(card, card.new)

	appState.pendingWork.delete(`edit-${card.id}`)
}

function activate() {
	appState.pendingWork.add(`edit-${card.id}`)

	state.active = true
	editor.readonly = false

	editor.root.focus()
}

async function wiggleAnimation() {
  editor.root.classList.remove('wiggle')

	// Trigger reflow to restart the animation
  void editor.root.offsetWidth

  editor.root.classList.add('wiggle')
}

defineExpose({ active: toRef(state, 'active') })
</script>

<template>
	<div
		ref="editor-ref"
		class="card-content-text"
		@click.left.exact="onClick"
		@keydown.delete="onKeyDelete"
		@paste.capture.stop.prevent="onPaste"
		@blur="onBlur"
	></div>
	<div class="selection-layer">
		<div ref="caret-ref" class="caret"></div>
	</div>
</template>

<style scoped>
.card-content-text {
	padding: .375rem;
	background-color: var(--color-card-background);
	border: 2px solid var(--color-card-border);
	border-radius: .375rem;
	box-shadow: var(--shadow);
}

.card.selected .card-content-text,
.card-content-text:focus {
	border-color: var(--color-accent);
}

.wiggle {
  animation: wiggle 100ms ease-in-out;
}

@keyframes wiggle {
  0%, 100% { transform: translateX(0px) rotate(0deg); }
  25% { transform: translateX(-5px) rotate(-5deg); }
  75% { transform: translateX(0px) rotate(10deg); }
}
</style>
