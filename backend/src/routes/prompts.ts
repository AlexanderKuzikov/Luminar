import express from 'express';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Paths } from '../utils/paths.js';
import type { Prompt } from '../types.js';

const router = express.Router();

function readPrompts(): Prompt[] {
  const file = Paths.prompts();
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as Prompt[];
  } catch {
    return [];
  }
}

function writePrompts(prompts: Prompt[]): void {
  fs.writeFileSync(Paths.prompts(), JSON.stringify(prompts, null, 2), 'utf-8');
}

// GET /api/prompts?type=generate|retouch
router.get('/', (req, res) => {
  const all = readPrompts();
  const type = req.query.type as string | undefined;
  const result = type ? all.filter(p => p.type === type) : all;
  res.json(result);
});

// GET /api/prompts/:id
router.get('/:id', (req, res) => {
  const prompt = readPrompts().find(p => p.id === req.params.id);
  if (!prompt) return res.status(404).json({ error: 'Not found' });
  res.json(prompt);
});

// POST /api/prompts
router.post('/', (req, res) => {
  const { title, type, text } = req.body as Partial<Prompt>;
  if (!title || !type || !text) {
    return res.status(400).json({ error: 'title, type and text are required' });
  }
  const prompts = readPrompts();
  const now = new Date().toISOString();
  const prompt: Prompt = { id: uuidv4(), title, type, text, created_at: now, updated_at: now };
  prompts.push(prompt);
  writePrompts(prompts);
  res.status(201).json(prompt);
});

// PUT /api/prompts/:id
router.put('/:id', (req, res) => {
  const prompts = readPrompts();
  const idx = prompts.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const { title, text } = req.body as Partial<Prompt>;
  if (title !== undefined) prompts[idx].title = title;
  if (text  !== undefined) prompts[idx].text  = text;
  prompts[idx].updated_at = new Date().toISOString();
  writePrompts(prompts);
  res.json(prompts[idx]);
});

// DELETE /api/prompts/:id
router.delete('/:id', (req, res) => {
  const prompts = readPrompts();
  const idx = prompts.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  prompts.splice(idx, 1);
  writePrompts(prompts);
  res.json({ ok: true });
});

export default router;
