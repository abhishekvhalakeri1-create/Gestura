import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    // The sandbox preview is served from a proxied https origin; allow it.
    allowedHosts: true,
    headers: {
      // getUserMedia is only available in a secure context. The preview host is
      // https, but these headers keep camera access working behind the proxy too.
      'Permissions-Policy': 'camera=*, microphone=()',
    },
  },
  optimizeDeps: {
    exclude: ['@mediapipe/tasks-vision'],
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
  },
});
