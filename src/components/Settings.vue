<script setup lang="ts">
import { useSettings } from '../composables/settings'
import Toggle from './UI/Toggle.vue'

const { settings, settingsVisible } = useSettings()
</script>

<template>
	<Transition name="settings">
		<div v-if="settingsVisible" class="settings">
			<div class="settings-page">
				<div class="settings-header">
					<h1>Settings</h1>
					<button class="button-close" @click="settingsVisible = false">✕</button>
				</div>
				<h2 class="section-header">Appearance</h2>

				<div class="settings-option">
					<input
						type="radio"
						class="color-theme"
						name="color-theme"
						value="system"
						v-model="settings.colorTheme"
						style="background-color: gray;"
					/>
					<input
						type="radio"
						class="color-theme"
						name="color-theme"
						value="dark"
						v-model="settings.colorTheme"
						style="background-color: black;"
					/>
					<input
						type="radio"
						class="color-theme"
						name="color-theme"
						value="light"
						v-model="settings.colorTheme"
						style="background-color: white;"
					/>
					<input
						v-for="color in ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'gray']"
						:key="color"
						type="radio"
						class="color"
						name="accent-color"
						:value="color"
						v-model="settings.colorAccent"
						:style="{ '--color-select': `var(--color-${color})` }"
					/>
				</div>
				<label class="settings-option">
					Board Background<br>
					<select id="background-select" v-model="settings.boardBackground">
						<option value="dot">Dot</option>
						<option value="grid">Grid</option>
						<option value="blank">Blank</option>
					</select>
				</label>
				<label class="settings-option">
					Content Font (eg Roboto, Inter, Noto Serif, ...)<br>
					<input type="text" class="font" v-model="settings.fontContent">
				</label>
				<label class="settings-option">
					Monospace Font (eg Ubuntu Mono, Menlo, JetBrains Mono, ...)<br>
					<input type="text" class="font-mono" v-model="settings.fontMonospace">
				</label>
				<small style="opacity: .75;">WARNING: changing fonts can shift the sizes of your cards</small>
				<h2 class="section-header">Interface</h2>
				<label class="settings-option">
					Require doubleclick to create cards
					<Toggle v-model="settings.doubleClickCreateCard" />
				</label>
				<label class="settings-option">
					Long press selection mode<br>
					<input
						type="radio"
						name="selection-mode"
						value="draw"
						v-model="settings.selectionMode"
					/>
					Draw
					<input
						type="radio"
						name="selection-mode"
						value="box"
						v-model="settings.selectionMode"
					/>
					Box
				</label>
			</div>
		</div>
	</Transition>
</template>

<style>
.settings {
	display: flex;
	position: fixed;
	inset: 0;
	flex-direction: column;
	align-items: center;
	background-color: var(--color-background);
	overflow-y: auto;
	scrollbar-gutter: stable both-edges;
	user-select: none;

	.settings-page {
		display: flex;
		width: 100%;
		max-width: 960px;
		padding: 2rem 1rem;
		flex-direction: column;

		.settings-header {
			display: flex;
			justify-content: space-between;
			align-items: center;

			h1 {
				margin-block: 0;
				font-size: 2rem;
			}

			.button-close {
				position: relative;
				height: 2.25rem;
				aspect-ratio: 1;
				font-size: 1.5rem;
				font-weight: bold;
				border-radius: 100%;
			}
		}

		.section-header {
			margin-block: 2rem 1rem;
			padding-bottom: .25rem;
			font-size: 1.25rem;
			border-bottom: 1px solid #303030;
		}

		.settings-option {
			display: block;
			user-select: none;
		}

		.color-theme {
			appearance: none;
			width: 100px;
			height: 80px;
			border-radius: .625rem;
			border: 1px solid red;

			&:focus-visible {
				outline: 2px solid #f008;
			}

			&:focus-visible,
			&:checked {
				border: 2px solid red;
			}
		}

		.font {
			margin-top: .25rem;
			font-family: var(--font-content);
			line-height: 1.25rem;
		}

		.font-mono {
			margin-top: .25rem;
			font-family: var(--font-monospace);
			line-height: 1.25rem;
		}

		input[type="radio"] {
			margin: .25rem .5rem;
		}

		input[type="radio"].color {
			appearance: none;
			width: 1.5rem;
			height: 1.5rem;
			background-color: var(--color-select);
			border-color: var(--color-select);
			border-radius: 100%;
			accent-color: var(--color-select);

			&:checked {
				outline: 2px solid var(--color-select);
				outline-offset: 4px;
			}
		}
	}
}

@media (prefers-reduced-motion: no-preference) {
	.settings-enter-active,
	.settings-leave-active {
		overflow-y: hidden;
		transition: 400ms cubic-bezier(0.075, 0.820, 0.165, 1.000);
	}

	.settings-enter-from,
	.settings-leave-to {
		scale: 1.25;
		opacity: 0;
	}

	.board {
		transition: 400ms cubic-bezier(0.075, 0.820, 0.165, 1.000);
	}

	.board:has(+ .settings:not(.settings-leave-active)) {
		scale: .75;
	}
}
</style>
