<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useSettings } from '../composables/settings'
import { useKeymap } from '../composables/keys'
import Toggle from '../components/UI/Toggle.vue'
import IconClose from '../components/Icons/IconClose.vue'
import IconComputer from '../components/Icons/IconComputer.vue'
import IconMoon from '../components/Icons/IconMoon.vue'
import IconSun from '../components/Icons/IconSun.vue'
import IconDots from '../components/Icons/IconDots.vue'
import IconGrid from '../components/Icons/IconGrid.vue'
import IconBlank from '../components/Icons/IconBlank.vue'
import IconDrawSelection from '../components/Icons/IconDrawSelection.vue'
import IconBoxSelection from '../components/Icons/IconBoxSelection.vue'

const router = useRouter()
const settings = useSettings()

useKeymap({
	'Escape': () => {
		router.back()
	}
})
</script>

<template>
	<div class="settings">
		<div class="settings-page">
			<div class="settings-page-header">
				<h1>Settings</h1>
				<button class="button-close" @click="$router.back()">
					<IconClose />
				</button>
			</div>

			<h2 class="settings-section-header">Appearance</h2>

			<div class="settings-option">
				<div class="info">
					<label class="name">Accent Color</label>
				</div>
				<div class="control">
					<div class="accent-color">
						<input
							v-for="color in ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'gray']"
							:key="color"
							type="radio"
							name="accent-color"
							:value="color"
							v-model="settings.colorAccent"
							:style="{ '--color-select': `var(--color-${color})` }"
						/>
					</div>
				</div>
			</div>

			<div class="settings-option">
				<div class="info">
					<label class="name">Color Theme</label>
				</div>
				<div class="control">
					<div class="combobox">
						<div class="option">
							<IconComputer />
							<input
								type="radio"
								name="color-theme"
								value="system"
								v-model="settings.colorTheme"
							>
						</div>
						<div class="option">
							<IconMoon />
							<input
								type="radio"
								name="color-theme"
								value="dark"
								v-model="settings.colorTheme"
							>
						</div>
						<div class="option">
							<IconSun />
							<input
								type="radio"
								name="color-theme"
								value="light"
								v-model="settings.colorTheme"
							>
						</div>
					</div>
				</div>
			</div>

			<div class="settings-option">
				<div class="info">
					<label class="name">Board background</label>
				</div>
				<div class="control">
					<div class="combobox">
						<div class="option">
							<IconDots />
							<input
								type="radio"
								name="board-background"
								value="dot"
								v-model="settings.boardBackground"
							>
						</div>
						<div class="option">
							<IconGrid />
							<input
								type="radio"
								name="board-background"
								value="grid"
								v-model="settings.boardBackground"
							>
						</div>
						<div class="option">
							<IconBlank />
							<input
								type="radio"
								name="board-background"
								value="blank"
								v-model="settings.boardBackground"
							>
						</div>
					</div>
				</div>
			</div>

			<h2 class="settings-section-header">Interface</h2>

			<div class="settings-option">
				<div class="info">
					<label class="name">Trackpad Sensitivity</label>
					<div class="description">Scroll and zoom sensitivity when using a trackapd</div>
				</div>
				<div class="control">
					<input
						type="range"
						min=".25"
						max="1"
						step=".25"
						v-model="settings.trackpadSensitivity"
					>
				</div>
			</div>

			<div class="settings-option">
				<div class="info">
					<label class="name">Require doubleclick to create cards</label>
					<div class="description">Avoid accidentally creating new cards when using a mouse</div>
				</div>
				<div class="control">
					<Toggle v-model="settings.doubleClickCreateCard" />
				</div>
			</div>

			<div class="settings-option">
				<div class="info">
					<label class="name">Type anywhere</label>
					<div class="description">Start typing anywhere to create a new card</div>
				</div>
				<div class="control">
					<Toggle v-model="settings.typeAnywhere" />
				</div>
			</div>

			<div class="settings-option">
				<div class="info">
					<label class="name">Selection mode</label>
					<div class="description">Press and hold to start selecting cards</div>
				</div>
				<div class="control">
					<div class="combobox">
						<div class="option">
							<IconDrawSelection />
							<input
								type="radio"
								name="selection-mode"
								value="draw"
								v-model="settings.selectionMode"
							>
						</div>
						<div class="option">
							<IconBoxSelection />
							<input
								type="radio"
								name="selection-mode"
								value="box"
								v-model="settings.selectionMode"
							>
						</div>
					</div>
				</div>
			</div>

		</div>
	</div>
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
}

.settings-page {
	display: flex;
	width: 100%;
	max-width: 960px;
	padding: 2rem 1rem;
	gap: 1rem;
	flex-direction: column;

	.settings-page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;

		h1 {
			margin-block: 0;
			font-size: 2rem;
		}

		.button-close {
			height: 2rem;
			width: 2rem;
			padding: .25rem;
			background-color: transparent;
			border-radius: 100%;

			.icon {
				width: 1.5rem;
				height: 1.5rem;
				opacity: .75;
			}

			&:hover,
			&:focus-visible {
				background-color: #80808040;

				.icon {
					opacity: 1;
				}
			}
		}
	}
}

.settings-section-header {
	margin: 0;
	margin-top: 1rem;
	padding-bottom: 1rem;
	font-size: 1.25rem;
	border-bottom: 1px solid #80808040;
}

.settings-option {
	display: flex;

	.info {
		display: flex;
		flex-direction: column;
		gap: .5rem;
		flex-grow: 1;

		.name {
			font-weight: bold;
		}

		.description {
			font-size: .75rem;
			opacity: .75;
		}
	}
}

.accent-color {
	display: flex;
	gap: 1rem;
	justify-content: center;

	input[type="radio"] {
		appearance: none;
		width: 1.5rem;
		height: 1.5rem;
		margin: 0;
		background-color: var(--color-select);
		border: 4px solid var(--color-background);
		border-radius: 100%;
		cursor: pointer;

		&:checked {
			border-color: color-mix(in srgb, var(--color-select), transparent 50%);
		}

		&:focus-visible {
			outline-color: var(--color-select);
		}
	}
}

input[type="range"] {
	border-radius: .5rem;
}

.combobox {
	display: flex;

	.option {
		position: relative;
		z-index: 0;

		&:has(:checked) {
			color: #202020;
			z-index: 1;
		}

		.icon {
			position: absolute;
			width: 1.25rem;
			height: 1.25rem;
			margin: .125rem;
			pointer-events: none;
		}

		input[type="radio"] {
			appearance: none;
			display: block;
			width: 1.5rem;
			height: 1.5rem;
			margin: 0;
			background-color: #80808040;
			border-radius: 0;
			cursor: pointer;

			&:checked {
				background-color: var(--color-accent);
			}
		}

		&:first-child input[type="radio"] {
			border-radius: .375rem 0 0 .375rem;
		}

		&:last-child input[type="radio"] {
			border-radius: 0 .375rem .375rem 0;
		}
	}
}
</style>
