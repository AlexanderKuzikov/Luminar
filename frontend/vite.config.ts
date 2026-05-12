import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import monacoEditorPlugin from 'vite-plugin-monaco-editor';
import path from 'path';
import { readFileSync } from 'fs';
import { resolve } from 'path';

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

// vite-plugin-monaco-editor экспортирует объект с .default в CJS-окружении
// поэтому нужно проверить оба варианта
const monacoPlugin = typeof monacoEditorPlugin === 'function'
  ? monacoEditorPlugin
  : (monacoEditorPlugin as any).default;

export default defineConfig({
  plugins: [
    vue(),
    monacoPlugin({
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
