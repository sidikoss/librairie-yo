import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import Sitemap from "vite-plugin-sitemap";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Librairie YO',
        short_name: 'LibYO',
        description: 'Librairie digitale en Guinée',
        theme_color: '#1e40af',
        background_color: '#ffffff',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone'],
        orientation: 'portrait',
        dir: 'ltr',
        categories: ['books', 'shopping', 'lifestyle'],
        id: '/?source=pwa',
        start_url: '/?source=pwa',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ],
        screenshots: [
          {
            src: 'og-image.png',
            sizes: '1024x1024',
            type: 'image/png',
            form_factor: 'wide'
          },
          {
            src: 'og-image.png',
            sizes: '1024x1024',
            type: 'image/png',
            form_factor: 'narrow'
          }
        ],
        shortcuts: [
          {
            name: "Catalogue",
            short_name: "Catalogue",
            description: "Voir tous les livres",
            url: "/catalogue",
            icons: [{ src: "pwa-192x192.png", sizes: "192x192" }]
          },
          {
            name: "Panier",
            short_name: "Panier",
            description: "Voir votre panier",
            url: "/panier",
            icons: [{ src: "pwa-192x192.png", sizes: "192x192" }]
          }
        ]
      }
    }),
    Sitemap({
      hostname: 'https://librairie-yo.vercel.app',
      dynamicRoutes: [
        '/',
        '/catalogue',
        '/panier',
        '/checkout',
        '/favoris',
        '/commandes'
      ]
    })
  ],
  server: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: true,
  },
  preview: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: true,
  },
  build: {
    chunkSizeWarningLimit: 500,
    cssCodeSplit: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) {
            return "vendor-react";
          }
          if (id.includes("node_modules/react-router-dom")) {
            return "vendor-router";
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"],
  },
  test: {
    environment: "jsdom",
    globals: true,
  },
});
