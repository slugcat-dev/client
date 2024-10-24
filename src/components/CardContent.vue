<script setup lang="ts">
import { onMounted, reactive, useTemplateRef } from 'vue'
import { disableRule, Editor } from '@slugcat-dev/mark-ed'
import { moveCaretWhereClicked, moveLine, smoothCaret } from '../editor'

const { card } = defineProps<{ card: Card }>()
const contentRef = useTemplateRef('content')
const caretRef = useTemplateRef('caret')
const state = reactive({
	active: false
})
let editor: Editor

onMounted(() => {
	editor = new Editor(contentRef.value!, {
		content: card.content,
		readonly: true,
		hideMarks: true,
		keymap: {
			'Alt ArrowUp': editor => moveLine(editor, true),
			'Alt ArrowDown': editor => moveLine(editor, false)
		},
		markdown: {
			lineGrammar: {
				ThematicBreak: disableRule
			}
		}
	})

	editor.addEventListener('change', () => {
		card.content = editor.content
	})

	smoothCaret(editor, caretRef.value!)

	if (card.id === 'new')
		activate()
})

function onClick(event: MouseEvent) {
	if (state.active)
		return

	activate()
	moveCaretWhereClicked(event)

	// Force a selection update after moving the caret
	editor.setSelection(editor.getSelection())
}

function onBlur() {
	state.active = false
	editor.readonly = true

	if (card.id === 'new')
		card.id = Date.now()
}

function activate() {
	state.active = true
	editor.readonly = false

	editor.root.focus()
}

defineExpose(state)
</script>

<template>
	<div
		ref="content"
		class="card-content"
		@click.left="onClick"
		@blur="onBlur"
	></div>
	<div class="selection-layer">
		<div ref="caret" class="caret"></div>
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
</style>
