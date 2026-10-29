import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // The PDF renderer is lazy-loaded; its minified chunk is 1.3 MB (about 436 KB gzipped).
    chunkSizeWarningLimit: 1400,
  },
  server: {
    host: '0.0.0.0',
    port: 3002,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
    hmr: {
      host: '127.0.0.1',
      protocol: 'ws',
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 3003,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
