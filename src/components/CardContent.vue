<script setup lang="ts">
import { onMounted, useTemplateRef } from 'vue'
import { disableRule, Editor } from '@slugcat-dev/mark-ed'
import { moveLine, smoothCaret } from '../editor'

const { card } = defineProps<{ card: Card }>()
const contentRef = useTemplateRef('content')
const caretRef = useTemplateRef('caret')
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

	smoothCaret(editor, caretRef.value!)
})

function onClick() {
	editor.readonly = false
	editor.root.focus()

	// TODO: move caret where clicked
}

function onBlur() {
	editor.readonly = true
}
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
