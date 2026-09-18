// Imports
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';




// Dev server + /api and /uploads proxy to backend
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const backendUrl = env.VITE_BACKEND_URL || 'http://localhost:5005';
  const devHost   = env.VITE_DEV_HOST  || '0.0.0.0';
  const devPort   = parseInt(env.VITE_DEV_PORT) || 5173;

  return {
    plugins: [react()],
    server: {
      host: devHost,
      port: devPort,
      proxy: {
        '/api': {
          target: backendUrl,                                           // REST → Express
          changeOrigin: true,
        },
        '/uploads': {
          target: backendUrl,                                           // attachment files in dev
          changeOrigin: true,
        },
      },
    },
  };
});
