import path from 'path';
import fs from 'fs';

/**
 * Корень репозитория / рабочей директории.
 * Dev:      cwd = backend/  → идём на уровень выше
 * Portable: рядом с exe → директория exe
 * Fallback: cwd как есть
 */
export function getRootDir(): string {
  // dev: cwd = backend/
  const devRoot = path.join(process.cwd(), '..');
  if (fs.existsSync(path.join(devRoot, 'config.json'))) return devRoot;

  // portable: рядом с exe
  const exeRoot = path.dirname(process.execPath);
  if (fs.existsSync(path.join(exeRoot, 'config.json'))) return exeRoot;

  // fallback: cwd как есть
  return process.cwd();
}

/**
 * data/ всегда рядом с корнем.
 * Если DATA_DIR задан в .env — используем его.
 * Без проверки existsSync — папка будет создана через initDataDir().
 * НИКОГДА не падаем в AppData.
 */
export function getDataDir(): string {
  if (process.env.DATA_DIR) return process.env.DATA_DIR;
  return path.join(getRootDir(), 'data');
}

export function getPublicDir(): string {
  const candidates = [
    path.join(process.cwd(), 'public'),
    path.join(path.dirname(process.execPath), 'public'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return path.join(process.cwd(), 'public');
}

export const Paths = {
  config:     () => path.join(getRootDir(), 'config.json'),
  snippets:   () => path.join(getDataDir(), 'snippets.json'),
  blueprints: () => path.join(getDataDir(), 'blueprints'),
  media:      () => path.join(getDataDir(), 'media'),
  registry:   () => path.join(getDataDir(), 'media', 'registry.json'),
  logs:       () => path.join(getDataDir(), 'logs'),
};
