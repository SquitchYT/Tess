import { defineConfig } from 'vite'


export default defineConfig({
	clearScreen: false,
	server: {
		strictPort: true,
	},
	envPrefix: ['VITE_', 'TAURI_'],
	build: {
		target: ['es2021', 'chrome100', 'safari13'],
		minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
		sourcemap: !!process.env.TAURI_DEBUG,
		outDir: '../src-tauri/dist'
	},
	root: "./src",
	css: {
		preprocessorOptions: {
			scss: {
				additionalData: process.platform === 'linux' ? '@import "./target/linux.scss"' : ''
			}
		}
	}
})