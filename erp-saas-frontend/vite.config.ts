import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/** Backend API en dev (debe coincidir con PORT en erp-saas-backend/.env). */
const defaultApiProxy = 'http://127.0.0.1:3000';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiProxy = env.VITE_DEV_API_PROXY?.trim() || defaultApiProxy;

  return {
    plugins: [react()],
    resolve: { alias: { '@': path.resolve(__dirname, './src') } },
    server: {
      port: 5173,
      // Túneles / previews (p. ej. trycloudflare.com) además de localhost
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
