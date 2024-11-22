<script setup lang="ts">
import { useToaster } from '../composables/toaster'
import { onMounted } from 'vue'
import { ofetch } from 'ofetch'
import { createCard, deleteCard, updateCard } from '../composables/cards'

const apiURL = import.meta.env.APP_API_URL
const { card } = defineProps<{ card: Card, canvas: Canvas }>()
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
		<img
			class="link-icon"
			:src="card.content.icon ?? 'default-icon.svg'"
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
</template>

<style scoped>
.card-content-link {
	display: flex;
	width: 240px;
	padding: .375rem;
	gap: .375rem;
	background-color: var(--color-card-background);
	border: 2px solid var(--color-card-border);
	border-radius: .375rem;
	box-shadow: var(--shadow);
}

.link-icon {
	width: 2rem;
	height: 2rem;
	padding: .25rem;
	background-color: light-dark(#e0e0e0, #383838);
	border-radius: .375rem;
	box-shadow: var(--shadow);
	-webkit-touch-callout: none;
}

.link-text {
	display: flex;
	max-width: calc(100% - 2.375rem);
	flex-direction: column;
	justify-content: center;
	line-height: 1rem;
	overflow: hidden;
	white-space: nowrap;

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

.ellipsis {
	overflow: hidden;
	text-overflow: ellipsis;
}

.card.selected .card-content-link {
	border-color: var(--color-accent);
}
</style>
