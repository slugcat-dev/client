<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAppState } from '../composables/appState'
import { useStorage } from '../composables/storage'
import { ofetch } from 'ofetch'
import { loginUser, logoutUser } from '../user'

const apiURL = import.meta.env.APP_API_URL
const state = reactive({
	email: '',
	otp: '',
	otpSent: false
})
const router = useRouter()
const appState = useAppState()
const storage = await useStorage()

async function sendOTP() {
	await ofetch(`${apiURL}/auth/send-otp`, {
		method: 'POST',
		body: {
			email: state.email.trim()
		}
	})

	state.otpSent = true
}

async function verifyOTP() {
	const { token } = await ofetch(`${apiURL}/auth/verify-otp`, {
		method: 'POST',
		body: {
			email: state.email.trim(),
			otp: state.otp.trim()
		}
	})

	storage.token = token

	await loginUser()
	router.push('/')
}
</script>

<template>
	<div v-if="appState.loggedIn" class="login-view">
		<h1>You are logged in as</h1>
		{{ storage.user }}
		<br>
		<button @click="logoutUser">Log Out</button>
		<button @click="$router.push('/')">Go Home</button>
	</div>
	<div v-else class="login-view">
		<div>
			<input v-model="state.email" :disabled="state.otpSent" placeholder="E-Mail">
			<button :disabled="state.otpSent" @click="sendOTP">Send OTP</button>
		</div>
		<div v-if="state.otpSent">
			<input v-model="state.otp" placeholder="OTP">
			<button @click="verifyOTP">Verify OTP</button>
		</div>
	</div>
</template>

<style>
.login-view {
	position: fixed;
	top: 50%;
	left: 50%;
	translate: -50% -50%;
}
</style>
