import path from 'path';
import fs from 'fs';
import os from 'os';

let _dataDir: string | null = null;

/**
 * Корень репозитория / рабочей директории.
 * В dev: process.cwd() = backend/, идём на уровень выше.
 * В portable-сборке: рядом с исполняемым файлом.
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

export function getDataDir(): string {
  if (_dataDir) return _dataDir;

  if (process.env.DATA_DIR) {
    _dataDir = process.env.DATA_DIR;
    return _dataDir;
  }

  const root = getRootDir();
  const candidate = path.join(root, 'data');
  if (fs.existsSync(candidate)) {
    _dataDir = candidate;
    return _dataDir;
  }

  // fallback: AppData
  const appData = process.env.LOCALAPPDATA ?? os.homedir();
  _dataDir = path.join(appData, 'luminar', 'data');
  return _dataDir;
}

export function getPublicDir(): string {
  const candidates = [
    path.join(process.cwd(), 'public'),
    path.join(path.dirname(process.execPath), 'public'),
    path.join(__dirname, '..', 'public'),
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
