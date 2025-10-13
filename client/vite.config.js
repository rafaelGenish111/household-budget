import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            injectRegister: 'auto',
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg', 'offline.html'],
            manifest: {
                name: 'ניהול משק בית',
                short_name: 'משק בית',
                description: 'Household Budget Manager',
                theme_color: '#1976d2',
                background_color: '#ffffff',
                display: 'standalone',
                scope: '/',
                start_url: '/',
                dir: 'rtl',
                lang: 'he',
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
                    },
                    {
                        src: 'pwa-512x512-maskable.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable'
                    }
                ]
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
                runtimeCaching: [
                    {
                        urlPattern: ({ url }) => url.pathname.startsWith('/api'),
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'api-cache',
                            networkTimeoutSeconds: 10,
                            cacheableResponse: { statuses: [0, 200] }
                        }
                    },
                    {
                        urlPattern: ({ request }) => request.destination === 'image',
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'image-cache',
                            expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 }
                        }
                    }
                ]
            }
        })
    ],
    server: {
        host: '0.0.0.0', // מאפשר גישה מהרשת
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:7000',
                changeOrigin: true,
            },
        },
    },
});

