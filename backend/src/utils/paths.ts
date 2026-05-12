import path from 'path';
import { fileURLToPath } from 'url';

export function getRootDir(): string {
  // SEA: process.execPath рядом с config.json
  // Dev: два уровня вверх от backend/src/utils/
  if (process.env.LUMINAR_ROOT) return process.env.LUMINAR_ROOT;
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(__dirname, '..', '..', '..');
}

export function getDataDir(): string {
  return path.join(getRootDir(), 'data');
}

export function getPublicDir(): string {
  return path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'public');
}

export const Paths = {
  data:     () => getDataDir(),
  media:    () => path.join(getDataDir(), 'media'),
  logs:     () => path.join(getDataDir(), 'logs'),
  prompts:  () => path.join(getDataDir(), 'prompts.json'),
  registry: () => path.join(getDataDir(), 'media', 'registry.json'),
};
