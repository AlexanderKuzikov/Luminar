import fs from 'fs';
import path from 'path';
import { Paths } from './paths.js';
import type { AppConfig, Provider } from '../types.js';

const DEFAULT_CONFIG: AppConfig = {
  active_provider: '',
  ui: {
    theme: 'dark',
    default_output: 'subfolder',
  },
  providers: [],
};

let _config: AppConfig | null = null;

export function loadConfig(): AppConfig {
  const configPath = Paths.config();

  if (!fs.existsSync(configPath)) {
    saveConfig(DEFAULT_CONFIG);
    _config = { ...DEFAULT_CONFIG };
    return _config;
  }

  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    _config = JSON.parse(raw) as AppConfig;
    return _config;
  } catch {
    console.error('[config] Failed to parse config.json, using defaults');
    _config = { ...DEFAULT_CONFIG };
    return _config;
  }
}

export function getConfig(): AppConfig {
  if (!_config) return loadConfig();
  return _config;
}

export function saveConfig(config: AppConfig): void {
  const configPath = Paths.config();
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  _config = config;
}

export function getActiveProvider(): Provider | null {
  const config = getConfig();
  return config.providers.find(p => p.id === config.active_provider) ?? null;
}

export function getProviderById(id: string): Provider | null {
  const config = getConfig();
  return config.providers.find(p => p.id === id) ?? null;
}
