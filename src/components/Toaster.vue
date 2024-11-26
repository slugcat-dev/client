<script setup lang="ts">
import { useToaster } from '../composables/toaster'

const { toasts } = useToaster()
</script>

<template>
	<div class="toaster">
		<div
			v-for="toast in toasts"
			:key="toast.id"
			class="toast"
			:class="{ persistent: toast.persistent }"
			:style="{
				'--color-toast': `var(--color-${toast.color})`,
				'animation': toast.color === 'red' ? 'error-shake 500ms' : 'none'
			}"
		>
			{{ toast.message }}
		</div>
	</div>
</template>

<style>
.toaster {
	display: flex;
	position: fixed;
	left: 50%;
	bottom: 1rem;
	flex-direction: column;
	align-items: center;
	gap: .5rem;
	translate: -50% 0;
	pointer-events: none;

	.toast {
		width: max-content;
		padding: .5rem .75rem;
		color: #d0d0d0;
		background-color: #181818;
		border: 1px solid #282828;
		border-radius: 5rem;
		box-shadow: var(--shadow);
		opacity: 0;
		transition: scale 200ms, opacity 1s 3s ease-in;

		@starting-style {
			scale: 0;
			opacity: 1;
		}

		&.persistent {
			order: 1;
			opacity: 1;
			transition: scale 200ms;
		}

		&::before {
			content: '';
			display: inline-block;
			width: .625rem;
			height: .625rem;
			margin-right: .5rem;
			background-color: var(--color-toast);
			border-radius: 100%;
			box-shadow: 0 0 0 4px transparent;
			transition: box-shadow 500ms 200ms;

			@starting-style {
				box-shadow: 0 0 0 0 var(--color-toast);
			}
		}
	}
}

@keyframes error-shake {
  0%, 100% { transform: translateX(0px); }
  20%, 60% { transform: translateX(-5px); }
  40%, 80% { transform: translateX(5px); }
}
</style>
