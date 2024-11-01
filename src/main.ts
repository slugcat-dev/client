
// Import stylesheets
import './assets/style.css'
import './assets/mark-ed.css'
import 'highlight.js/styles/github-dark.css'

// Create Vue app
import { createApp } from 'vue'
import { usePointer } from './composables/pointer'
import App from './App.vue'

const app = createApp(App)

// Use global pointer state instead of having listeners for each card
const { pointer, pointers } = usePointer()

app.provide('pointer', pointer)
app.provide('pointers', pointers)
app.mount('#app')
