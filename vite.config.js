import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      port: parseInt(env.VITE_PORT) || 4170,
      proxy: {
        '/api': {
          target: env.VITE_API_TARGET || 'http://localhost:8091',
          changeOrigin: true,
        },
      },
    },
  };
});

