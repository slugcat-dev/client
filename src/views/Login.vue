<script setup lang="ts">
import { useRouter } from 'vue-router'
import { reactive } from 'vue'
import { ofetch } from 'ofetch'
import { loginUser } from '../user'
import { logBadge } from '../utils'

const apiURL = import.meta.env.APP_API_URL
const state = reactive({
	email: '',
	otp: '',
	otpSent: false
})
const router = useRouter()

async function sendOTP() {
	await ofetch(`${apiURL}/auth/send-otp`, {
		method: 'POST',
		body: {
			email: state.email
		}
	})

	state.otpSent = true
}

async function verifyOTP() {
	const { token } = await ofetch(`${apiURL}/auth/verify-otp`, {
		method: 'POST',
		body: {
			email: state.email,
			otp: state.otp
		}
	})

	localStorage.setItem('token', token)
	await loginUser()
	console.log('%cAUTH', logBadge('#f2cc60'), 'Logged in')
	await router.push('/')

}
</script>

<template>
	<div class="login">
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
.login {
	position: fixed;
	top: 50%;
	left: 50%;
	translate: -50% -50%;
}
</style>
