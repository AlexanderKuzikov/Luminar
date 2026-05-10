import express from 'express';
import { createServer } from 'http';
import net from 'net';
import path from 'path';
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

// ─── Port finder ─────────────────────────────────────────────────────────────

function isPortFree(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, '127.0.0.1', () => {
      server.close(() => resolve(true));
    });
    server.on('error', () => resolve(false));
  });
}

async function findFreePort(startPort = 3000, maxAttempts = 20): Promise<number> {
  for (let port = startPort; port < startPort + maxAttempts; port++) {
    if (await isPortFree(port)) return port;
  }
  throw new Error(`No free port found in range ${startPort}–${startPort + maxAttempts}`);
}

// ─── Bootstrap ───────────────────────────────────────────────────────────────

async function bootstrap(): Promise<void> {
  // 1. Инициализация файловой структуры data/
  initDataDir();

  // 2. Загрузка конфига
  loadConfig();

  // 3. Express app
  const app = express();
  app.use(express.json({ limit: '50mb' }));

  // 4. API роуты
  app.use('/api/files',      filesRouter);
  app.use('/api/batch',      batchRouter);
  app.use('/api/generate',   generateRouter);
  app.use('/api/blueprints', blueprintsRouter);
  app.use('/api/snippets',   snippetsRouter);
  app.use('/api/config',     configRouter);
  app.use('/api/registry',   registryRouter);

  // 5. Статика фронтенда
  const publicDir = getPublicDir();
  app.use(express.static(publicDir));

  // SPA fallback: все не-API роуты → index.html
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.sendFile(path.join(publicDir, 'index.html'));
  });

  // 6. Поиск свободного порта и старт
  const port = await findFreePort(3000);
  const server = createServer(app);

  server.listen(port, '127.0.0.1', async () => {
    const url = `http://localhost:${port}`;
    logger.info(`Luminar server started at ${url}`);

    // 7. Открываем браузер
    try {
      const { default: open } = await import('open');
      await open(url);
    } catch {
      logger.warn('Could not open browser automatically');
    }
  });

  process.on('SIGINT',  () => { logger.info('Shutting down...'); server.close(); process.exit(0); });
  process.on('SIGTERM', () => { logger.info('Shutting down...'); server.close(); process.exit(0); });
}

bootstrap().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
