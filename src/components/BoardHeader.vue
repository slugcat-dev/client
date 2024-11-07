<script setup lang="ts">
import { useSettings } from '../composables/settings'
import IconSettings from './Icons/IconSettings.vue'

const { settingsVisible } = useSettings()
</script>

<template>
	<header class="board-header">
		<span class="board-name"></span>
		<button
			class="settings-button"
			title="Settings"
			@click="settingsVisible = true"
		>
			<IconSettings />
		</button>
	</header>
</template>

<style>
.board-header {
	display: flex;
	padding: .25rem 1rem;
	gap: 1rem;
	align-items: center;
	user-select: none;

	.board-name {
		flex-grow: 1;
		font-weight: bold;
	}
}

.settings-button {
	width: 2rem;
	height: 2rem;
	padding: .25rem;
	background-color: transparent;
	border-radius: 100%;

	.icon {
		width: 1.5rem;
		height: 1.5rem;
		opacity: .75;
		transition: rotate 200ms;
	}

	&:hover,
	&:focus-visible {
		background-color: light-dark(#e0e0e0, #404040);

		.icon {
			opacity: 1;
			rotate: 60deg;
		}
	}
}
</style>
