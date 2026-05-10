import express from 'express';
import { getConfig, saveConfig } from '../utils/config.js';
import type { AppConfig } from '../types.js';

const router = express.Router();

// GET /api/config
router.get('/', (_req, res) => {
  const config = getConfig();
  // Маскируем API-ключи перед отдачей клиенту
  const safe = {
    ...config,
    providers: config.providers.map(p => ({
      ...p,
      apiKey: p.apiKey ? '***' + p.apiKey.slice(-4) : '',
    })),
  };
  res.json(safe);
});

// PUT /api/config — обновить конфиг
router.put('/', (req, res) => {
  try {
    const incoming = req.body as AppConfig;
    const current = getConfig();
    // Если в запросе ключ замаскирован (***), оставляем текущий
    const merged: AppConfig = {
      ...incoming,
      providers: incoming.providers.map(p => {
        const existing = current.providers.find(cp => cp.id === p.id);
        return {
          ...p,
          apiKey: p.apiKey.startsWith('***') && existing ? existing.apiKey : p.apiKey,
        };
      }),
    };
    saveConfig(merged);
    res.json({ ok: true });
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
