<script setup lang="ts">
import { useSettings } from '../composables/settings'

const { settingsVisible } = useSettings()
</script>

<template>
	<header class="board-header">
		<span></span>
		<button @click="settingsVisible = true">Settings</button>
	</header>
</template>

<style>
.board-header {
	display: flex;
	padding: .5rem 1rem;
	justify-content: space-between;
	align-items: center;
	user-select: none;
}
</style>
