<script setup lang="ts">
import { inject, onMounted } from 'vue'
import { useToaster } from '../composables/toaster'
import { ofetch } from 'ofetch'

const apiURL = import.meta.env.APP_API_URL
const { card } = defineProps<{ card: Card }>()
const { createCard, deleteCard, updateCard } = inject('cards') as Cards
const { toast } = useToaster()
const hostname = new URL(card.content.url).hostname.replace(/^www\./, '')

onMounted(async () => {
	if (card.new) {
		try {
			card.content = await ofetch(`${apiURL}/link-data?url=${encodeURIComponent(card.content.url)}`)

			updateCard(card, true)
		} catch {
			createCard({ pos: card.pos, content: card.content.url })
			deleteCard(card)
			toast('Could not get link preview', 'red')
		}
	}
})

defineExpose({ active: false })
</script>

<template>
	<div class="card-content-link">
		<div class="link-info">
			<div v-if="card.new" class="link-icon">
				<div class="loader"></div>
			</div>
			<img
				v-else
				class="link-icon"
				:src="card.content.icon ? `${apiURL}/proxy?url=${card.content.icon}` : 'default-icon.svg'"
				draggable="false"
				loading="lazy"
				decoding="async"
			>
			<div class="link-text">
				<a
				class="link-title ellipsis"
				:href="card.content.url"
				target="_blank"
				draggable="false"
				>
					{{ card.content.title ?? card.content.url }}
				</a>
				<div class="link-site-name">{{ card.content.siteName ?? hostname }}</div>
			</div>
		</div>
		<img
			v-if="card.content.image"
			:src="`${apiURL}/proxy?url=${card.content.image}`"
			class="link-image"
			draggable="false"
			loading="lazy"
			decoding="async"
		/>
	</div>
</template>

<style scoped>
.card-content-link {
	width: 240px;
	padding: .375rem;
	background-color: var(--color-card-background);
	border: 2px solid var(--color-card-border);
	border-radius: .375rem;
	box-shadow: var(--shadow);
}

.card.selected .card-content-link {
	border-color: var(--color-accent);
}

.link-info {
	display: flex;
	gap: .375rem;
}

.link-icon,
.link-image {
	display: block;
	border-radius: .375rem;
	-webkit-touch-callout: none;
}

.link-icon {
	width: 2rem;
	height: 2rem;
	padding: .25rem;
	background-color: #80808040;
	box-shadow: var(--shadow);
}

.link-icon .loader {
	width: 1.5rem;
	height: 1.5rem;

	&::before,
	&::after {
		background-color: currentColor;
	}
}

.link-text {
	display: flex;
	max-width: calc(100% - 2.375rem);
	flex-direction: column;
	justify-content: center;
	line-height: 1rem;

	.link-title {
		font-weight: bold;
		text-decoration: none;
		color: inherit;

		&:hover,
		&:focus-visible {
			text-decoration: underline;
		}
	}

	.link-site-name {
		font-size: .75rem;
		opacity: .75;
	}
}

.link-image {
	max-width: 100%;
	margin-inline: auto;
	margin-top: .375rem;
}
</style>
