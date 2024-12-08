<script setup lang="ts">
import { inject, onMounted, reactive, toRef, watch } from 'vue'
import { fileToBase64, limitSize, loadImage } from '../utils'
import { useEventListener } from '@vueuse/core'
import { uploadFile } from '../upload'
import { useToaster } from '../composables/toaster'
import UploadProgress from './UploadProgress.vue'

const apiURL = import.meta.env.APP_API_URL
const { card } = defineProps<{ card: Card }>()
const mustUpload = 'file' in card.content
const state = reactive({
	cardLoading: !mustUpload,
	uploading: false,
	uploadProgress: 0,
	uploadFailed: false,
	previewLoading: false,
	imgWidth: 0,
	imgHeight: 0,
	active: false
})
const { updateCard } = inject('board') as BoardContext
const { toast } = useToaster()
const lqip = `${apiURL}/image-lqip?url=${encodeURIComponent(card.content.src)}`
let keyListenerCleanup: Function

onMounted(() => {
	if (mustUpload)
		uploadImage()
})

// Close the image preview with escape
watch(() => state.active, () => {
	state.previewLoading = state.active

	if (state.active) {
		keyListenerCleanup = useEventListener('keydown', (event: KeyboardEvent) => {
			if (event.key === 'Escape')
				state.active = false
		})
	} else
		keyListenerCleanup()
})

async function onLoad(event: Event) {
	const target = event.target as HTMLImageElement
	const imageRef = card.content.src.startsWith('data') ? target : await loadImage(card.content.src)

	state.imgWidth = imageRef.naturalWidth
	state.imgHeight = imageRef.naturalHeight

	if (card.content.width === undefined || card.content.height === undefined) {
		const [width, height] = limitSize(state.imgWidth, state.imgHeight, 40, 240)

		card.content.width = width
		card.content.height = height
	}

	state.cardLoading = false
}

function activate() {
	if (card.content.src.startsWith('data'))
		return

	state.active = true
}

async function uploadImage() {
	if (!card.content.src)
		card.content.src = await fileToBase64(card.content.file)

	try {
		state.uploading = true
		state.uploadProgress = 0
		state.uploadFailed = false

		const { filename } = await uploadFile({
			base64: card.content.src,
			name: card.content.file.name,
			type: card.content.file.type
		}, progress => state.uploadProgress = progress)

		delete card.content.file

		card.content.src = `${apiURL}/uploads/${filename}`
		state.uploading = false

		updateCard(card, true)
	} catch {
		state.uploading = false
		state.uploadFailed = true

		toast('Upload failed', 'red')
	}
}

function retryUpload() {
	updateCard(card)
	uploadImage()
}

defineExpose({
	imgWidth: toRef(state, 'imgWidth'),
	imgHeight: toRef(state, 'imgHeight'),
	active: toRef(state, 'active')
})
</script>

<template>
	<img
		class="card-content-image"
		:src="state.cardLoading ? lqip : card.content.src"
		draggable="false"
		loading="lazy"
		:style="{
			width: `${card.content.width ?? 0}px`,
			height: `${card.content.height ?? 0}px`,
		}"
		@load.once="onLoad"
		@click.left.exact="activate"
	>
	<UploadProgress
		:uploading="state.uploading"
		:retry="state.uploadFailed"
		:progress="state.uploadProgress"
		@retry="retryUpload"
	/>
	<div v-if="state.cardLoading" class="loader"></div>
	<div v-if="state.imgWidth >= 40 && state.imgHeight >= 40" class="resize-d"></div>
	<Teleport to="body">
		<Transition name="image-preview">
			<div
				v-if="state.active"
				class="image-preview"
				@click="state.active = false"
			>
				<img
					:src="card.content.src"
					decoding="async"
					@load="() => state.previewLoading = false"
				>
				<div v-if="state.previewLoading" class="loader"></div>
			</div>
		</Transition>
	</Teleport>
</template>

<style scoped>
.card-content-image {
	display: block;
	border-radius: .375rem;
	filter: drop-shadow(var(--shadow));
	-webkit-touch-callout: none;
}

.card.selected .card-content-image,
.card:hover .card-content-image {
	background-color: var(--color-card-background);
}

.card.selected .card-content-image {
	outline: 2px solid var(--color-accent);
}

.loader {
	position: absolute;
	top: 50%;
	left: 50%;
	width: 2rem;
	height: 2rem;
	transform: translate(-50%, -50%);
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
	z-index: 1;

	img {
		display: block;
		max-width: 100%;
		max-height: 100%;
		user-select: none;
	}

	.loader {
		transition: opacity 200ms 1s;
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

	.image-preview-leave-active .loader {
		transition: opacity 400ms;
	}

	.image-preview-enter-from,
	.image-preview-leave-to {
		background-color: transparent;
		backdrop-filter: blur(0);

		.loader {
			opacity: 0;
		}

		img {
			opacity: 0;
			scale: .75;
		}
	}
}
</style>
