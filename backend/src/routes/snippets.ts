import express from 'express';
import fs from 'fs';
import { Paths } from '../utils/paths.js';

const router = express.Router();

// GET /api/snippets
router.get('/', (_req, res) => {
  try {
    res.json(JSON.parse(fs.readFileSync(Paths.snippets(), 'utf-8')));
  } catch {
    res.json({});
  }
});

// PUT /api/snippets — перезаписать весь файл
router.put('/', (req, res) => {
  try {
    fs.writeFileSync(Paths.snippets(), JSON.stringify(req.body, null, 2), 'utf-8');
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to save' });
  }
});

export default router;
