import express from 'express';
import { getAllEntries, getSessionList, updateEntryStatus } from '../utils/registry.js';

const router = express.Router();

// GET /api/registry — все записи
router.get('/', (_req, res) => {
  res.json(getAllEntries());
});

// GET /api/registry/sessions — список сессий
router.get('/sessions', (_req, res) => {
  res.json(getSessionList());
});

// PATCH /api/registry/:id/reject — пометить как rejected
router.patch('/:id/reject', (req, res) => {
  updateEntryStatus(Number(req.params.id), 'rejected');
  res.json({ ok: true });
});

export default router;
