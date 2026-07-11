import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Alias '@' -> src, para poder usar importaciones absolutas del tipo
    // '@/components/Button/Button.jsx' en vez de rutas relativas '../../'.
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})