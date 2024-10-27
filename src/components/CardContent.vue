<script setup lang="ts">
import { onMounted, reactive, useTemplateRef } from 'vue'
import { Editor } from '@slugcat-dev/mark-ed'
import { moveCaretWhereClicked, moveLine, smoothCaret } from '../editor'
import { deleteCard, updateCard } from '../composables/cards'

const { card, canvas } = defineProps<{
	card: Card,
	canvas: Canvas
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

	if (card.id === 'new')
		activate()
})

function onClick(event: MouseEvent) {
	if (state.active)
		return

	activate()
	moveCaretWhereClicked(editor, event)
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

	editor.root.focus()
}

defineExpose(state)
</script>

<template>
	<div
		ref="content-ref"
		class="card-content"
		@click.left="onClick"
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
</style>
