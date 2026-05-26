import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// In dev, Vite serves on :3000 and proxies API/auth to the backend on :3001.
// In production, the built dist/ is served by server.js (Express) which proxies separately.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
      '/auth': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2022',
  },
});
