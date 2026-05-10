import fs from 'fs';
import path from 'path';
import { Paths } from './paths.js';

const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10 MB

function getLogPath(name: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return path.join(Paths.logs(), `${name}_${date}.log`);
}

function write(name: string, level: string, message: string): void {
  const logsDir = Paths.logs();
  fs.mkdirSync(logsDir, { recursive: true });

  const logPath = getLogPath(name);

  // Rolling: если файл > 10МБ — переименовываем
  if (fs.existsSync(logPath) && fs.statSync(logPath).size > MAX_LOG_SIZE) {
    fs.renameSync(logPath, logPath.replace('.log', '_old.log'));
  }

  const line = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}\n`;
  fs.appendFileSync(logPath, line, 'utf-8');
}

export const logger = {
  info:  (msg: string) => { console.log(`[INFO] ${msg}`);  write('app', 'info', msg); },
  warn:  (msg: string) => { console.warn(`[WARN] ${msg}`); write('app', 'warn', msg); },
  error: (msg: string) => { console.error(`[ERR] ${msg}`); write('app', 'error', msg); },
};

export const providerLogger = {
  log: (data: unknown) => write('provider', 'info', JSON.stringify(data)),
};
