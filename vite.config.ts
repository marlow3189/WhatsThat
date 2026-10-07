/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// `npm run build`         → dist/app (aplikacja: przeglądarka pod /app/ i Capacitor webDir), potem
//                            scripts/build-site.mjs dokłada stronę główną z linkami do sklepów w dist/
// `npm run build:preview` → dist-preview/index.html, jeden plik do szybkiego podglądu
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react(), tailwindcss(), ...(mode === 'preview' ? [viteSingleFile()] : [])],
  build: { outDir: mode === 'preview' ? 'dist-preview' : 'dist/app', emptyOutDir: true },
  test: { environment: 'node' },
}))
