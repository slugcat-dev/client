<script setup lang="ts">
import { useSettings } from '../composables/settings'
import IconBlank from './Icons/IconBlank.vue'
import IconSnap from './Icons/IconSnap.vue'
import IconGrid from './Icons/IconGrid.vue'
import IconSettings from './Icons/IconSettings.vue'

const { settings, settingsVisible } = useSettings()
</script>

<template>
	<header class="board-header">
		<div>
			<div class="combobox">
				<div class="option">
					<IconBlank />
					<input
						type="radio"
						name="snap"
						value="none"
						v-model="settings.snap"
					>
				</div>
				<div class="option">
					<IconSnap />
					<input
						type="radio"
						name="snap"
						value="cards"
						v-model="settings.snap"
					>
				</div>
				<div class="option">
					<IconGrid />
					<input
						type="radio"
						name="snap"
						value="grid"
						v-model="settings.snap"
					>
				</div>
			</div>
		</div>
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
	justify-content: space-between;
	align-items: center;
	user-select: none;
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
