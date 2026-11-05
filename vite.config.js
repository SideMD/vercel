import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite root mirrors the canonical VS source tree in sideMD/side.
export default defineConfig({
  root: 'vs/dictation',
  plugins: [react()],
  build: { outDir: 'dist' },
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
})
