import express from 'express';
import fs from 'fs';
import path from 'path';
import { Paths } from '../utils/paths.js';
import { listBlueprints } from '../services/compiler.js';

const router = express.Router();

// GET /api/blueprints
router.get('/', (_req, res) => {
  res.json(listBlueprints());
});

// GET /api/blueprints/:id
router.get('/:id', (req, res) => {
  const filePath = path.join(Paths.blueprints(), `${req.params.id}.json`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
  res.json(JSON.parse(fs.readFileSync(filePath, 'utf-8')));
});

// PUT /api/blueprints/:id
router.put('/:id', (req, res) => {
  const filePath = path.join(Paths.blueprints(), `${req.params.id}.json`);
  try {
    JSON.parse(JSON.stringify(req.body)); // Validate JSON
    fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2), 'utf-8');
    res.json({ ok: true });
  } catch {
    res.status(400).json({ error: 'Invalid JSON' });
  }
});

// POST /api/blueprints — создать новый
router.post('/', (req, res) => {
  const id = req.body.id ?? `blueprint_${Date.now()}`;
  const filePath = path.join(Paths.blueprints(), `${id}.json`);
  if (fs.existsSync(filePath)) return res.status(409).json({ error: 'Already exists' });
  fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2), 'utf-8');
  res.status(201).json({ ok: true, id });
});

// DELETE /api/blueprints/:id
router.delete('/:id', (req, res) => {
  const filePath = path.join(Paths.blueprints(), `${req.params.id}.json`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
  fs.unlinkSync(filePath);
  res.json({ ok: true });
});

export default router;
