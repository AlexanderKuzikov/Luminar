import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import monacoEditorPlugin from 'vite-plugin-monaco-editor';
import path from 'path';

export default defineConfig({
  plugins: [
    vue(),
    // Локальная сборка Monaco workers — без CDN
    (monacoEditorPlugin as any).default({
      languageWorkers: ['json', 'editorWorkerService'],
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  // В dev-режиме проксируем API-запросы на backend
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  build: {
    outDir: '../backend/public',
    emptyOutDir: true,
  },
});
