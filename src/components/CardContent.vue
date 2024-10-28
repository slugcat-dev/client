<script setup lang="ts">
import { onMounted, reactive, useTemplateRef } from 'vue'
import { Editor } from '@slugcat-dev/mark-ed'
import { moveCaretWhereClicked, moveLine, smoothCaret, toggleCheckbox } from '../editor'
import { deleteCard, updateCard } from '../composables/cards'

const { card, canvas, selection } = defineProps<{
	card: Card,
	canvas: Canvas,
	selection: CanvasSelection
}>()
const contentRef = useTemplateRef('content-ref')
const caretRef = useTemplateRef('caret-ref')
const state = reactive({ active: false })
let editor: Editor

onMounted(() => {
	editor = new Editor(contentRef.value!, {
		content: card.content,
		readonly: true,
		hideMarks: true,
		keymap: {
			'Alt ArrowUp': editor => moveLine(editor, true),
			'Alt ArrowDown': editor => moveLine(editor, false)
		}
	})

	smoothCaret(editor, caretRef.value!, canvas)

	if (card.id === 'new') {
		activate()

		if (card.content !== '')
			editor.setSelection(card.content.length)
	}
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

function onKeyDelete() {
	if (editor.content === '')
		contentRef.value!.blur()
}

function onBlur() {
	state.active = false
	editor.readonly = true
	card.content = editor.content

	if (card.content === '')
		deleteCard(card.id)
	else
		updateCard(card)
}

function activate() {
	state.active = true
	editor.readonly = false

	selection.clear()
	editor.root.focus()
}

defineExpose(state)
</script>

<template>
	<div
		ref="content-ref"
		class="card-content"
		@click.left.exact="onClick"
		@keydown.backspace="onKeyDelete"
		@keydown.delete="onKeyDelete"
		@blur="onBlur"
	></div>
	<div class="selection-layer">
		<div ref="caret-ref" class="caret"></div>
	</div>
</template>

<style>
.card-content {
	padding: .375rem;
	background-color: #282828;
	border: 2px solid #333;
	border-radius: .375rem;

	&:focus {
		border-color: var(--color-accent);
	}
}

.card.selected .card-content {
	border-color: var(--color-accent-50);
}
</style>
