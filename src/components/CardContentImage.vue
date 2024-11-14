<script setup lang="ts">
import { reactive, ref, toRef, watch } from 'vue'
import { useEventListener } from '@vueuse/core'

const { card } = defineProps<{ card: Card, canvas: Canvas }>()
const state = reactive({ active: false })
const imgWidth = ref(0)
const imgHeight = ref(0)
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

function onLoad(event: Event) {
	const imgRef = event.target as HTMLImageElement

	imgWidth.value = imgRef.naturalWidth
	imgHeight.value = imgRef.naturalHeight

	if (card.content.width === undefined || card.content.height === undefined) {
		const aspectRatio = imgWidth.value / imgHeight.value

		if (imgWidth.value <= 40 || imgHeight.value <= 40) {
			card.content.width = imgWidth
			card.content.height = imgHeight
		} else if (aspectRatio > 1) {
			card.content.width = Math.min(imgWidth.value, 240)
			card.content.height = card.content.width / aspectRatio
		} else {
			card.content.height = Math.min(imgHeight.value, 240)
			card.content.width = card.content.height * aspectRatio
		}
	}
}

defineExpose({ imgWidth, imgHeight, active: toRef(state, 'active') })
</script>

<template>
	<div class="card-content">
		<img
			class="card-content-image"
			:src="card.content.src"
			draggable="false"
			loading="lazy"
			decoding="async"
			:style="{
				width: `${card.content.width ?? 0}px`,
				height: `${card.content.height ?? 0}px`
			}"
			@load="onLoad"
			@click.left.exact="state.active = true"
		>
		<div v-if="imgWidth >= 60 && imgHeight >= 60" class="resize-d"></div>
		<Teleport to="body">
			<Transition name="image-preview">
				<div
					v-if="state.active"
					class="image-preview"
					@click="state.active = false"
				>
					<img :src="card.content.src" decoding="async">
				</div>
			</Transition>
		</Teleport>
	</div>
</template>

<style scoped>
.card-content-image {
	display: block;
	border-radius: .375rem;
	filter: drop-shadow(var(--shadow));
	-webkit-touch-callout: none;
}

.card-content::after {
	content: '';
	position: absolute;
	inset: 0;
	border-radius: .375rem;
	pointer-events: none;
}

.card-content:hover::after {
	box-shadow: 0 0 0 2px var(--color-card-border) inset;
}

.card.selected .card-content::after {
	box-shadow: 0 0 0 2px var(--color-accent) inset;
}

.card.selected .card-content-image,
.card-content:hover .card-content-image {
	background-color: var(--color-card-background);
}

.resize-d {
	right: -.375rem;
	bottom: -.375rem;
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

@media (prefers-reduced-transparency: reduce) {
	.image-preview {
		background-color: black;
		backdrop-filter: none;
	}
}

@media (prefers-reduced-motion: no-preference) {
	.image-preview-enter-active,
	.image-preview-leave-active {
		transition: 400ms;

		img {
			transition: 400ms cubic-bezier(.68, -.55, .265, 1.55);
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
}
</style>
