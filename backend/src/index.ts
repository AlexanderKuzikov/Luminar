import { config as dotenvConfig } from 'dotenv';
import { getRootDir } from './utils/paths.js';
import path from 'path';

// Явный путь к .env — tsx может менять cwd на backend/, ищем корень проекта
dotenvConfig({ path: path.join(getRootDir(), '.env') });

import express from 'express';
import { createServer } from 'http';
import net from 'net';
import fs from 'fs';
import { initDataDir } from './utils/init.js';
import { loadConfig } from './utils/config.js';
import { logger } from './utils/logger.js';
import { getPublicDir } from './utils/paths.js';

import filesRouter from './routes/files.js';
import batchRouter from './routes/batch.js';
import generateRouter from './routes/generate.js';
import blueprintsRouter from './routes/blueprints.js';
import snippetsRouter from './routes/snippets.js';
import configRouter from './routes/config.js';
import registryRouter from './routes/registry.js';

function isPortFree(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, '127.0.0.1', () => {
      server.close(() => resolve(true));
    });
    server.on('error', () => resolve(false));
  });
}

async function findFreePort(startPort: number, maxAttempts = 20): Promise<number> {
  for (let port = startPort; port < startPort + maxAttempts; port++) {
    if (await isPortFree(port)) return port;
  }
  throw new Error(`Нет свободного порта в диапазоне ${startPort}–${startPort + maxAttempts}`);
}

async function bootstrap(): Promise<void> {
  initDataDir();

  const config = loadConfig();

  const app = express();
  app.use(express.json({ limit: '50mb' }));

  app.use('/api/files',      filesRouter);
  app.use('/api/batch',      batchRouter);
  app.use('/api/generate',   generateRouter);
  app.use('/api/blueprints', blueprintsRouter);
  app.use('/api/snippets',   snippetsRouter);
  app.use('/api/config',     configRouter);
  app.use('/api/registry',   registryRouter);

  const publicDir = getPublicDir();
  app.use(express.static(publicDir));

  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'Not found' });
    }
    const indexHtml = path.join(publicDir, 'index.html');
    if (!fs.existsSync(indexHtml)) {
      return res.status(503).json({ error: 'Frontend not built. Run: npm run build' });
    }
    res.sendFile(indexHtml);
  });

  const port = await findFreePort(config.port ?? 3333);
  const server = createServer(app);

  server.listen(port, '127.0.0.1', async () => {
    const url = `http://localhost:${port}`;
    logger.info(`Сервер запущен: ${url}`);

    try {
      const { default: open } = await import('open');
      await open(url);
    } catch {
      logger.warn('Не удалось открыть браузер автоматически');
    }
  });

  process.on('SIGINT',  () => { logger.info('Завершение...'); server.close(); process.exit(0); });
  process.on('SIGTERM', () => { logger.info('Завершение...'); server.close(); process.exit(0); });
}

bootstrap().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
