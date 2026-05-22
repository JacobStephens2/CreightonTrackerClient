import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import { VitePWA } from 'vite-plugin-pwa';

const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        shared: resolve(__dirname, 'shared.html'),
      },
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3456',
    },
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        navigateFallbackDenylist: [/^\/shared\//, /^\/api\//, /^\/privacy\/?$/, /^\/support\/?$/, /^\/acknowledgments\/?$/],
        // Activate updated service worker immediately on next launch instead
        // of waiting for all tabs to close, so a single refresh picks up new
        // code rather than requiring close-and-reopen twice.
        skipWaiting: true,
        clientsClaim: true,
      },
      manifest: {
        name: 'Creighton Cycle Tracker',
        short_name: 'CrMS Tracker',
        description: 'Free Creighton Model (CrMS) fertility cycle tracker. Chart observations, track mucus patterns, identify peak days, and share with your FertilityCare Practitioner.',
        categories: ['health', 'medical', 'lifestyle'],
        theme_color: '#4CAF50',
        background_color: '#FAFAFA',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'app-icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'app-icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'app-icons/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
});
