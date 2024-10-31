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
			:style="{
				'--color': `var(--color-${toast.color})`,
				'animation': toast.color === 'red' ? 'shake .5s' : 'none'
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
		padding: .5rem .75rem;
		background-color: #181818;
		border: 1px solid #282828;
		border-radius: 5rem;
		box-shadow: 0 2px 4px #0002;
		opacity: 0;
		transition: scale .2s, opacity 1s 3s ease-in;

		&::before {
			content: '';
			display: inline-block;
			width: .625rem;
			height: .625rem;
			margin-right: .5rem;
			background-color: var(--color);
			border-radius: 100%;
			box-shadow: 0 0 0 4px transparent;
			transition: box-shadow .5s .2s;

			@starting-style {
				box-shadow: 0 0 0 0 var(--color);
			}
		}

		@starting-style {
			scale: 0;
			opacity: 1;
		}
	}
}

@keyframes error-shake {
  0%, 100% { transform: translateX(0px); }
  20%, 60% { transform: translateX(-5px); }
  40%, 80% { transform: translateX(5px); }
}
</style>
