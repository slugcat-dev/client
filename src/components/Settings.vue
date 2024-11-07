<script setup lang="ts">
import { useSettings } from '../composables/settings'
import { watch } from 'vue'
import { useEventListener } from '@vueuse/core'
import Toggle from './UI/Toggle.vue'
import IconClose from './Icons/IconClose.vue'
import IconComputer from './Icons/IconComputer.vue'
import IconMoon from './Icons/IconMoon.vue'
import IconSun from './Icons/IconSun.vue'
import IconDots from './Icons/IconDots.vue'
import IconGrid from './Icons/IconGrid.vue'
import IconBlank from './Icons/IconBlank.vue'
import IconDrawSelection from './Icons/IconDrawSelection.vue'
import IconBoxSelection from './Icons/IconBoxSelection.vue'

const { settings, settingsVisible } = useSettings()
let keyListenerCleanup: Function

// Close the image preview with escape
watch(settingsVisible, () => {
	if (settingsVisible.value) {
		keyListenerCleanup = useEventListener('keydown', (event: KeyboardEvent) => {
			if (event.key === 'Escape')
				settingsVisible.value = false
		})
	} else
		keyListenerCleanup()
})
</script>

<template>
	<Transition name="settings">
		<div v-if="settingsVisible" class="settings">
			<div class="settings-page">
				<div class="settings-page-header">
					<h1>Settings</h1>
					<button
						class="button-close"
						data-tooltip="Close"
						@click="settingsVisible = false"
					>
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
				background-color: light-dark(#e0e0e0, #404040);

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
	border-bottom: 1px solid light-dark(#c8c8c8, #383838);
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

		&:checked {
			border-color: color-mix(in srgb, var(--color-select), transparent 50%);
		}

		&:focus-visible {
			outline-color: var(--color-select);
		}
	}
}

.combobox {
	display: flex;

	.option {
		.icon {
			position: absolute;
			width: 1.5rem;
			height: 1.5rem;
			margin: .25rem;
			pointer-events: none;
		}

		&:has(:checked) {
			color: #202020;
		}

		input[type="radio"] {
			appearance: none;
			display: block;
			width: 2rem;
			height: 2rem;
			margin: 0;
			background-color: light-dark(#d0d0d0, #404040);

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

@media (prefers-reduced-motion: no-preference) {
	.settings-enter-active,
	.settings-leave-active {
		overflow-y: hidden;
		transition: 400ms cubic-bezier(.075, .820, .165, 1);
	}

	.settings-enter-from,
	.settings-leave-to {
		scale: 1.125;
		opacity: 0;
	}

	.board {
		transition: 400ms cubic-bezier(.075, .820, .165, 1);
	}

	.board:has(+ .settings:not(.settings-leave-active)) {
		scale: .875;
	}
}
</style>
