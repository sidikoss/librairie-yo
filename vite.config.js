import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React dans son propre chunk — change rarement → cache navigateur
          'vendor-react': ['react', 'react-dom'],
          // Firebase retiré du bundle initial — chargé uniquement si besoin
        },
      },
    },
    chunkSizeWarningLimit: 400,
  },
})
