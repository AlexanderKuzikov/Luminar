import express from 'express';
import { getConfig, saveConfig } from '../utils/config.js';
import type { AppConfig } from '../types.js';

const router = express.Router();

// GET /api/config
// Возвращает конфиг. Значения API-ключей НИКОГДА не отдаются клиенту —
// только метаданные (id, label, envVar) и флаг наличия значения в env.
router.get('/', (_req, res) => {
  const config = getConfig();
  const safe = {
    ...config,
    providers: config.providers.map(p => ({
      ...p,
      keys: p.keys.map(k => ({
        ...k,
        // Клиент видит только: есть ключ в .env или нет
        configured: !!(process.env[k.envVar]),
      })),
    })),
  };
  res.json(safe);
});

// PUT /api/config
// Сохраняет структуру конфига. Значения ключей через этот endpoint не принимаются.
// Для смены ключа — редактировать .env напрямую.
router.put('/', (req, res) => {
  try {
    const incoming = req.body as AppConfig;

    // Базовая валидация
    if (typeof incoming.port !== 'number' || incoming.port < 1024 || incoming.port > 65535) {
      return res.status(400).json({ error: 'Invalid port (1024–65535)' });
    }
    if (!Array.isArray(incoming.providers)) {
      return res.status(400).json({ error: 'providers must be an array' });
    }

    const current = getConfig();

    // Мержим: сохраняем keys из текущего конфига (клиент может только переключать active_key)
    const merged: AppConfig = {
      ...incoming,
      providers: incoming.providers.map(p => {
        const existing = current.providers.find(cp => cp.id === p.id);
        return {
          ...p,
          // keys редактируются только напрямую в config.json — не через API
          keys: existing ? existing.keys : p.keys ?? [],
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
