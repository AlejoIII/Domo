import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

/** Backend API en dev (debe coincidir con PORT en erp-saas-backend/.env). */
const defaultApiProxy = 'http://127.0.0.1:3000';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiProxy = env.VITE_DEV_API_PROXY?.trim() || defaultApiProxy;

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'brand/domo-mark.svg',
          'brand/domo-mark.png',
          'icons/apple-touch-icon.png',
        ],
        manifest: {
          name: 'Domo',
          short_name: 'Domo',
          description: 'ERP en la nube para pymes. Facturación, inventario, CRM y más.',
          theme_color: '#438f7d',
          background_color: '#f7f4ef',
          display: 'standalone',
          orientation: 'any',
          start_url: '/',
          scope: '/',
          lang: 'es',
          categories: ['business', 'productivity'],
          icons: [
            {
              src: '/icons/pwa-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icons/pwa-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icons/pwa-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          navigateFallback: '/index.html',
          // No cachear API ni uploads: datos de negocio siempre en red
          navigateFallbackDenylist: [/^\/api\//, /^\/uploads\//],
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,webp}'],
          runtimeCaching: [
            {
              urlPattern: ({ url }) =>
                url.pathname.startsWith('/api/') || url.pathname.startsWith('/uploads/'),
              handler: 'NetworkOnly',
            },
          ],
        },
        devOptions: {
          // En local basta `npm run build && npm run preview` (HTTPS/localhost)
          enabled: false,
        },
      }),
    ],
    resolve: { alias: { '@': path.resolve(__dirname, './src') } },
    server: {
      port: 5173,
      allowedHosts: true,
      proxy: {
        '/api': apiProxy,
        '/uploads': apiProxy,
      },
    },
    preview: {
      port: 4173,
      proxy: {
        '/api': apiProxy,
        '/uploads': apiProxy,
      },
    },
  };
});
