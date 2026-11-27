import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // GitHub Pages serves the site under /japan-rhd-trainer/
  base: process.env.GITHUB_PAGES ? '/japan-rhd-trainer/' : '/',
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.svg', 'icons/icon-512.svg', 'og-preview.png'],
      manifest: {
        name: '日本右駕行前實戰演練 | Japan RHD Trainer',
        short_name: '日本右駕演練',
        description: '台灣赴日自駕 3–5 分鐘右駕認知、方向燈雨刷陷阱與日本差異號誌演練工具',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'any',
        lang: 'zh-Hant',
        start_url: './',
        icons: [
          {
            src: 'icons/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
          {
            src: 'icons/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png}'],
      },
    }),
  ],
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes('node_modules/three') ||
            ((id.includes('/src/scene3d/') || id.includes('\\src\\scene3d\\')) &&
              !id.includes('Fallback2DView'))
          ) {
            return 'scene3d';
          }
          return undefined;
        },
      },
    },
  },
});
