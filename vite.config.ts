/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { execSync } from 'node:child_process'

/** Skąd jest ta wersja (pokazujemy w zakładce Ja, przydaje się przy zgłaszaniu błędów). */
function build(): string {
  const sha = process.env.CF_PAGES_COMMIT_SHA ?? process.env.GITHUB_SHA
  if (sha) return sha.slice(0, 7)
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return 'dev'
  }
}

// `npm run build`         → dist/app (aplikacja: przeglądarka pod /app/ i Capacitor webDir), potem
//                            scripts/build-site.mjs dokłada stronę główną z linkami do sklepów w dist/
// `npm run build:preview` → dist-preview/index.html, jeden plik do szybkiego podglądu
export default defineConfig(({ mode }) => ({
  base: './',
  define: { __BUILD__: JSON.stringify(build()) },
  plugins: [react(), tailwindcss(), ...(mode === 'preview' ? [viteSingleFile()] : [])],
  build: { outDir: mode === 'preview' ? 'dist-preview' : 'dist/app', emptyOutDir: true },
  test: { environment: 'node' },
}))
