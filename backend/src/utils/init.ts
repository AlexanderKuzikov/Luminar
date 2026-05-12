import fs from 'fs';
import path from 'path';
import { getDataDir, Paths } from './paths.js';
import type { Prompt } from '../types.js';

const DEFAULT_PROMPTS: Prompt[] = [
  {
    id: 'default-generate-1',
    title: 'Портрет (пример)',
    type: 'generate',
    text: 'Professional portrait photo, soft studio lighting, neutral background, high detail, 8k',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'default-retouch-1',
    title: 'Мягкая ретушь (пример)',
    type: 'retouch',
    text: 'Retouch this photo: smooth skin, enhance colors, improve lighting. Keep the original composition.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export function initDataDir(): void {
  const dataDir = getDataDir();
  const mediaDir = path.join(dataDir, 'media');
  const logsDir  = path.join(dataDir, 'logs');

  for (const dir of [dataDir, mediaDir, logsDir]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(Paths.registry())) {
    fs.writeFileSync(Paths.registry(), '[]', 'utf-8');
  }

  if (!fs.existsSync(Paths.prompts())) {
    fs.writeFileSync(Paths.prompts(), JSON.stringify(DEFAULT_PROMPTS, null, 2), 'utf-8');
  }
}
