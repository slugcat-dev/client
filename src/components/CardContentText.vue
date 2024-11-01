<script setup lang="ts">
import { onMounted, reactive, toRef, useTemplateRef } from 'vue'
import { Editor } from '@slugcat-dev/mark-ed'
import { highlightCodeAddon, moveCaretWhereClicked, moveLine, smoothCaretAddon, toggleCheckbox } from '../editor'
import { useDebounceFn } from '@vueuse/core'
import { deleteCard, updateCard } from '../composables/cards'

const { card, canvas } = defineProps<{ card: Card, canvas: Canvas }>()
const contentRef = useTemplateRef('content-ref')
const caretRef = useTemplateRef('caret-ref')
const state = reactive({
	active: false,
	deleteIntent: false
})
const clearDeleteIntent = useDebounceFn(() => state.deleteIntent = false, 500)
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

	highlightCodeAddon(editor)
	smoothCaretAddon(editor, caretRef.value!, canvas)

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

function onKeyDelete(event: KeyboardEvent) {
	if (editor.content !== '' || event.repeat)
		return

	if (state.deleteIntent)
		return contentRef.value!.blur()

	state.deleteIntent = true

	clearDeleteIntent()
	wiggleAnimation()
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

async function wiggleAnimation() {
  contentRef.value!.classList.remove('wiggle')

	// Trigger reflow to restart the animation
  void contentRef.value!.offsetWidth

  contentRef.value!.classList.add('wiggle')
}

defineExpose({ active: toRef(state, 'active') })
</script>

<template>
	<div class="card-content">
		<div
			ref="content-ref"
			class="card-content-text"
			@click.left.exact="onClick"
			@keydown.delete="onKeyDelete"
			@blur="onBlur"
		></div>
		<div class="selection-layer">
			<div ref="caret-ref" class="caret"></div>
		</div>
	</div>
</template>

<style scoped>
.card-content-text {
	padding: .375rem;
	background-color: #282828;
	border: 2px solid #303030;
	border-radius: .375rem;
	box-shadow: 0 2px 4px #0002;
}

.card.selected .card-content-text,
.card-content-text:focus {
	border-color: var(--color-accent);
}

.wiggle {
  animation: wiggle .1s ease-in-out;
}

@keyframes wiggle {
  0%, 100% { transform: translateX(0px) rotate(0deg); }
  25% { transform: translateX(-5px) rotate(-5deg); }
  75% { transform: translateX(0px) rotate(10deg); }
}
</style>
