import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['asterixify_favicon_logo.png'],
      manifest: {
        name: 'Asterixify Event System',
        short_name: 'Asterixify',
        description: 'Event registration and check-in system by Asterixify Innovations',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'any',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'asterixify_favicon_logo.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'asterixify_favicon_logo.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'asterixify_favicon_logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        globIgnores: ['**/vision_board_background*', '**/mogmusic_background*'],
        runtimeCaching: [
          {
            // Supabase API — network first, fall back to cache
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Cloudinary images — cache first (they don't change)
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cloudinary-image-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
