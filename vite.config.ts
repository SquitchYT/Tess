import { defineConfig } from 'vite'
import { fileURLToPath, URL } from "url";
import path from "path";

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
        outDir: '../dist'
    },
    root: "./src"
})