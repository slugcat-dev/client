import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import autoprefixer from 'autoprefixer'

export default defineConfig({
	plugins: [vue()],
	base: '',
	envPrefix: 'APP',
	server: {
		port: 8000
	},
	css: {
		postcss: {
			plugins: [autoprefixer()]
		}
	},
	build: {
		chunkSizeWarningLimit: 1024
	}
})
