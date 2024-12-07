<script setup lang="ts">
import { inject, onMounted, reactive, useTemplateRef } from 'vue'
import { useToaster } from '../composables/toaster'
import { uploadFile } from '../upload'
import UploadProgress from './UploadProgress.vue'

const apiURL = import.meta.env.APP_API_URL
const { card } = defineProps<{ card: Card }>()
const audioRef = useTemplateRef('audioRef')
const state = reactive({
	uploading: false,
	uploadProgress: 0,
	uploadFailed: false,
	playing: false,
	progress: 0,
	durationTimestamp: '-:--',
	elapsedTimestamp: '0:00'
})
const { updateCard } = inject('board') as BoardContext
const { toast } = useToaster()
let audio: HTMLAudioElement

onMounted(() => {
	if (card.new)
		upload()

	audio = audioRef.value!

	audio.addEventListener('loadeddata', () => {
		state.durationTimestamp = toTimestamp(audio.duration)
	})

	audio.addEventListener('timeupdate', () => {
		state.progress = (audio.currentTime / audio.duration) * 100
		state.elapsedTimestamp = toTimestamp(audio.currentTime)
	})

	audio.addEventListener('ended', () => {
		audio.currentTime = 0
	})
})

function togglePlay() {
	if (audio.readyState === HTMLMediaElement.HAVE_NOTHING)
		return

	if (audio.paused)
		audio.play()
	else
		audio.pause()
}

async function upload() {
	try {
		state.uploading = true
		state.uploadProgress = 0
		state.uploadFailed = false

		const { filename, title } = await uploadFile(card.content.file, progress => state.uploadProgress = progress)

		delete card.content.file

		card.content.src = `${apiURL}/uploads/${filename}`
		card.content.title = title
		state.uploading = false

		updateCard(card, true)
	} catch (e) {
		console.error(e)
		state.uploading = false
		state.uploadFailed = true

		toast('Upload failed', 'red')
	}
}

function retryUpload() {
	updateCard(card)
	upload()
}

function toTimestamp(duration: number) {
	let seconds = Math.round(duration)
	let minutes = Math.floor(seconds / 60)
	const hours = Math.floor(minutes / 60)

	seconds -= minutes * 60
	minutes = minutes % 60

	if (hours > 0)
		return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

	return `${minutes}:${String(seconds).padStart(2, '0')}`
}

defineExpose({ active: false })
</script>

<template>
	<div class="card-content-audio">
		<audio ref="audioRef" :src="card.content.src"></audio>
		<button
			class="play-pause-button"
			@click="togglePlay"
		>
			<svg v-if="audioRef?.paused" width="24" height="24" viewBox="0 0 24 24">
				<path fill="currentColor" d="M8 17.175V6.825q0-.425.3-.713t.7-.287q.125 0 .263.037t.262.113l8.15 5.175q.225.15.338.375t.112.475t-.112.475t-.338.375l-8.15 5.175q-.125.075-.262.113T9 18.175q-.4 0-.7-.288t-.3-.712" />
			</svg>
			<svg v-else width="24" height="24" viewBox="0 0 24 24">
				<path fill="currentColor" d="M16 19q-.825 0-1.412-.587T14 17V7q0-.825.588-1.412T16 5t1.413.588T18 7v10q0 .825-.587 1.413T16 19m-8 0q-.825 0-1.412-.587T6 17V7q0-.825.588-1.412T8 5t1.413.588T10 7v10q0 .825-.587 1.413T8 19" />
			</svg>
		</button>
		<div class="audio-info">
			<div class="audio-title ellipsis">
				{{ card.content.title ?? card.content.file.name }}
			</div>
			<div class="progress">
				<div class="elapsed" :style="{ width: `${state.progress}%` }"></div>
			</div>
			<div class="timestamp">
				{{ state.elapsedTimestamp }} <span style="opacity: .5;">/</span> {{ state.durationTimestamp }}
			</div>
		</div>
		<UploadProgress
			:uploading="state.uploading"
			:retry="state.uploadFailed"
			:progress="state.uploadProgress"
			@retry="retryUpload"
		/>
	</div>
</template>

<style scoped>
.card-content-audio {
	display: flex;
	width: 240px;
	padding: .375rem;
	gap: .375rem;
	align-items: center;
	background-color: var(--color-card-background);
	border: 2px solid var(--color-card-border);
	border-radius: .375rem;
	box-shadow: var(--shadow);
}

.card.selected .card-content-audio {
	border-color: var(--color-accent);
}

.play-pause-button {
	width: 2rem;
	height: 2rem;
	padding: .25rem;
	border-radius: 100%;

	svg {
		display: block;
	}
}

.audio-info {
	display: flex;
	flex-direction: column;
	flex-grow: 1;

	.audio-title {
		font-weight: bold;
	}

	.timestamp {
		font-size: .625rem;
	}
}

.progress {
	height: .25rem;
	margin-block: .25rem;
	flex-grow: 1;
	background-color: #80808040;
	border-radius: .125rem;

	.elapsed {
		position: relative;
		height: inherit;
		background-color: currentColor;
		border-radius: inherit;
	}
}
</style>
