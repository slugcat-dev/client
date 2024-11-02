<script setup lang="ts">
import { reactive, toRef, watch } from 'vue'
import { useEventListener } from '@vueuse/core'

const { card } = defineProps<{ card: Card, canvas: Canvas }>()
const state = reactive({ active: false })
let keyListenerCleanup: Function

// Close the image preview with escape
watch(state, () => {
	if (state.active) {
		keyListenerCleanup = useEventListener('keydown', (event: KeyboardEvent) => {
			if (event.key === 'Escape')
				state.active = false
		})
	} else
		keyListenerCleanup()
})

defineExpose({ active: toRef(state, 'active') })
</script>

<template>
	<div class="card-content">
		<img
			class="card-content-image"
			:src="card.content"
			draggable="false"
			@click.left.exact="state.active = true"
		>
		<Teleport to="body">
			<Transition name="image-preview">
				<div
					v-if="state.active"
					class="image-preview"
					@click="state.active = false"
				>
					<img :src="card.content">
				</div>
			</Transition>
		</Teleport>
	</div>
</template>

<style scoped>
.card-content-image {
	display: block;
	width: auto;
	max-width: 250px;
	height: auto;
	max-height: 200px;
	border-radius: .375rem;
	filter: drop-shadow(0 2px 4px #0002);
	-webkit-touch-callout: none;
}

.card-content::after {
	content: '';
	position: absolute;
	inset: 0;
	border-radius: .375rem;
	pointer-events: none;
}

.card:hover .card-content::after {
	box-shadow: 0 0 0 2px #80808018 inset;
}

.card.selected .card-content::after {
	box-shadow: 0 0 0 2px var(--color-accent) inset;
}

.card.selected .card-content-image,
.card:hover .card-content-image {
	background-color: #282828;
}

.image-preview {
	display: flex;
	position: fixed;
	inset: 0;
	align-items: center;
	justify-content: center;
	padding: 2rem;
	background-color: #000a;
	backdrop-filter: blur(8px);

	img {
		display: block;
		max-width: 100%;
		max-height: 100%;
		user-select: none;
	}
}

.image-preview-enter-active,
.image-preview-leave-active {
	transition: .4s;

	img {
		transition: .4s cubic-bezier(.68, -.55, .265, 1.55);
	}
}

.image-preview-enter-from,
.image-preview-leave-to {
	background-color: transparent;
	backdrop-filter: blur(0);

	img {
		opacity: 0;
		scale: .75;
	}
}
</style>
