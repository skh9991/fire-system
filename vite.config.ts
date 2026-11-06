import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['icon-192.png', 'icon-512.png', 'photos/*'],
    manifest: {
      name: '소방 계통도 훈련판', short_name: '계통도 훈련판', lang: 'ko',
      description: '소방시설 계통도를 탐색하고 퍼즐, 연결 그리기, 동작 순서로 익히는 수업 앱',
      theme_color: '#BF2A1E', background_color: '#E9EEEA', display: 'standalone', start_url: '.',
      icons: [
        { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,png,jpg,webp,woff2}'],
      maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
    },
  })],
});
