import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Séparer les vendors pour un meilleur cache navigateur
        manualChunks: {
          // React dans son propre chunk (change rarement)
          'vendor-react': ['react', 'react-dom'],
          // Firebase dans son propre chunk (change rarement)
          'vendor-firebase': ['firebase/app', 'firebase/database'],
        },
      },
    },
    // Seuil d'avertissement remonté (Firebase est gros)
    chunkSizeWarningLimit: 600,
  },
})
