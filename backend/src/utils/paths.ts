import path from 'path';
import fs from 'fs';
import os from 'os';

let _dataDir: string | null = null;

/**
 * Определяет корневую директорию данных.
 * Portable-режим: папка data/ рядом с исполняемым файлом или process.cwd().
 * Fallback: %LOCALAPPDATA%/luminar/data (или ~/luminar/data на не-Windows).
 */
export function getDataDir(): string {
  if (_dataDir) return _dataDir;

  if (process.env.DATA_DIR) {
    _dataDir = process.env.DATA_DIR;
    return _dataDir;
  }

  const candidates = [
    path.join(process.cwd(), 'data'),
    path.join(path.dirname(process.execPath), 'data'),
    path.join(__dirname, '..', '..', '..', 'data'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      _dataDir = candidate;
      return _dataDir;
    }
  }

  const appData = process.env.LOCALAPPDATA ?? os.homedir();
  _dataDir = path.join(appData, 'luminar', 'data');
  return _dataDir;
}

export function getPublicDir(): string {
  const candidates = [
    path.join(process.cwd(), 'public'),
    path.join(path.dirname(process.execPath), 'public'),
    path.join(__dirname, '..', '..', '..', 'public'),
    path.join(__dirname, '..', 'public'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return path.join(process.cwd(), 'public');
}

export const Paths = {
  config:     () => path.join(getDataDir(), 'config.json'),
  snippets:   () => path.join(getDataDir(), 'snippets.json'),
  blueprints: () => path.join(getDataDir(), 'blueprints'),
  media:      () => path.join(getDataDir(), 'media'),
  registry:   () => path.join(getDataDir(), 'media', 'registry.json'),
  logs:       () => path.join(getDataDir(), 'logs'),
};
