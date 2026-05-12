import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import monacoEditorPlugin from 'vite-plugin-monaco-editor';
import path from 'path';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Читаем порт из корневого config.json — единый источник правды
function getBackendPort(): number {
  try {
    const configPath = resolve(__dirname, '../config.json');
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    return config.port ?? 3333;
  } catch {
    return 3333;
  }
}

const backendPort = getBackendPort();

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
  server: {
    port: 5173,
    proxy: {
      '/api': `http://localhost:${backendPort}`,
    },
  },
  build: {
    outDir: '../backend/public',
    emptyOutDir: true,
  },
});
