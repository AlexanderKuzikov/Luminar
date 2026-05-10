import express from 'express';
import {
  startBatchRetouch,
  getJob,
  cancelJob,
  registerSSEClient,
} from '../services/batch-controller.js';
import type { BatchRetouchRequest } from '../types.js';

const router = express.Router();

// POST /api/batch/retouch — запустить батч-задачу
router.post('/retouch', async (req, res) => {
  try {
    const body = req.body as BatchRetouchRequest;
    if (!body.source_files?.length) {
      return res.status(400).json({ error: 'source_files required' });
    }
    if (!body.blueprint_id) {
      return res.status(400).json({ error: 'blueprint_id required' });
    }
    const jobId = await startBatchRetouch(body);
    res.status(202).json({ jobId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// GET /api/batch/:id — статус задачи
router.get('/:id', (req, res) => {
  const job = getJob(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

// GET /api/batch/:id/events — SSE поток прогресса
router.get('/:id/events', (req, res) => {
  const job = getJob(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Отправляем текущий статус сразу при подключении
  res.write(`data: ${JSON.stringify({ type: 'init', payload: job })}\n\n`);

  const unregister = registerSSEClient(req.params.id, (data) => res.write(data));

  req.on('close', unregister);
});

// DELETE /api/batch/:id — отменить задачу
router.delete('/:id', (req, res) => {
  const ok = cancelJob(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Job not found or already finished' });
  res.json({ cancelled: true });
});

export default router;
