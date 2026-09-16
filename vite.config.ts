import tailwindcss from '@tailwindcss/postcss';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  base: './',
  css: { postcss: { plugins: [tailwindcss()] } },
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('.', import.meta.url)) },
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom/client',
      '@base-ui/react/button',
      '@base-ui/react/dialog',
      '@base-ui/react/select',
      '@base-ui/react/toggle',
      '@base-ui/react/toggle-group',
    ],
  },
  server: {
    host: '127.0.0.1',
    port: 3000,
    strictPort: true,
    watch: { useFsEvents: false, usePolling: true },
  },
  preview: { host: '127.0.0.1', port: 3000, strictPort: true },
});
