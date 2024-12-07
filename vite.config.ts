import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import autoprefixer from 'autoprefixer'

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), 'APP_')

	return {
		plugins: [vue()],
		envPrefix: 'APP_',
		base: env.APP_BASE_PATH,
		server: {
			port: 8000
		},
		css: {
			postcss: {
				plugins: [autoprefixer()]
			}
		},
		build: {
			target: 'ES2022',
			chunkSizeWarningLimit: 1024
		}
	}
})
