import { createApp, readonly } from 'vue'
import { usePointer } from './composables/pointer'
import App from './App.vue'

const app = createApp(App)

// Use global pointer state instead of having listeners for each card
const { pointer, pointers } = usePointer()

app.provide('pointer', readonly(pointer))
app.provide('pointers', readonly(pointers))
app.mount('#app')
