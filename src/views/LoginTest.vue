<script setup lang="ts">
import { reactive } from 'vue'
import { ofetch } from 'ofetch'

const apiURL = import.meta.env.APP_API_URL
const state = reactive({
	email: '',
	otp: ''
})

async function sendOTP() {
	await ofetch(`${apiURL}/auth/send-otp`, {
		method: 'POST',
		body: {
			email: state.email
		}
	})
}

async function verifyOTP() {
	const { token } = await ofetch(`${apiURL}/auth/verify-otp`, {
		method: 'POST',
		body: {
			email: state.email,
			otp: state.otp
		}
	})

	console.log(token)
}
</script>

<template>
	<div class="login">
		<input v-model="state.email">
		<button @click="sendOTP">Send OTP</button>
		<input v-model="state.otp">
		<button @click="verifyOTP">Verify OTP</button>
	</div>
</template>
