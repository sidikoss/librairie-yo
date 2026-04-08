import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Seuil d'avertissement raisonnable
    chunkSizeWarningLimit: 400,

    rollupOptions: {
      output: {
        manualChunks(id) {
          // React dans son propre chunk — change rarement → cache navigateur long
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          // AdminPanel isolé : chargé uniquement par l'admin
          // Vite gère automatiquement le dynamic import de AdminPanel.jsx
          // grâce au lazy() dans App.jsx → chunk séparé automatique
        },
      },
    },

    // Minification agressive (défaut Vite : esbuild, très rapide)
    minify: 'esbuild',

    // Génère des sourcemaps légers uniquement en dev
    sourcemap: false,

    // Optimise la gestion des CSS : extrait App.css en fichier séparé
    // → mis en cache indépendamment du JS
    cssCodeSplit: true,
  },

  // Optimisation des dépendances en dev (pre-bundling)
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
})
