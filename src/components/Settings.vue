<script setup lang="ts">
import { useSettings } from '../composables/settings'

const { settings, settingsVisible } = useSettings()
</script>

<template>
	<div v-if="settingsVisible" class="settings">
		<div class="settings-modal">
			<h1>Settings<button @click="settingsVisible = false">✕</button></h1>
			<h2>Appearance</h2>
			<label class="settings-option">
				Color Theme<br>
				<input
					type="radio"
					name="color-theme"
					value="system"
					v-model="settings.colorTheme"
				/>
				System
				<input
					type="radio"
					name="color-theme"
					value="dark"
					v-model="settings.colorTheme"
				/>
				Dark
				<input
					type="radio"
					name="color-theme"
					value="light"
					v-model="settings.colorTheme"
				/>
				Light
			</label>
			<label class="settings-option">
				Accent Color<br>
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
			</label>
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
			<h2>Interface</h2>
			<label class="settings-option">
				<input type="checkbox" v-model="settings.doubleClickCreateCard">
				Require doubleclick to create cards
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
</template>

<style>
.settings {
	display: flex;
	position: fixed;
	inset: 0;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	background-color: #000a;

	.settings-modal {
		display: flex;
		width: 100%;
		max-width: 720px;
		min-height: 500px;
		padding: 1rem;
		gap: 1rem;
		flex-direction: column;
		align-items: flex-start;
		background-color: #202020;
		border-radius: 1rem;
		box-shadow: 0 2px 8px #0004;

		h1 {
			display: flex;
			width: 100%;
			margin-top: 0;
			margin-bottom: 1rem;
			justify-content: space-between;
			align-items: center;

			button {
				border-radius: 100%;
				height: 100%;
				aspect-ratio: 1;
				font-size: .75em;
				font-weight: bold;
			}
		}

		h2 {
			margin-block: 0rem;
		}

		.settings-option {
			display: block;
			user-select: none;
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
			margin: .25rem;
		}

		input[type="radio"].color {
			appearance: none;
			width: 1rem;
			height: 1rem;
			background-color: var(--color-select);
			border-color: var(--color-select);
			border-radius: 100%;
			accent-color: var(--color-select);

			&:checked {
				outline: 2px solid var(--color-select);
				outline-offset: 2px;
			}
		}
	}
}
</style>
