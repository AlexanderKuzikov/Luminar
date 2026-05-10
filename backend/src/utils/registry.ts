import fs from 'fs';
import path from 'path';
import { Paths } from './paths.js';
import type { RegistryEntry, RegistryStatus } from '../types.js';

function readRegistry(): RegistryEntry[] {
  const registryPath = Paths.registry();
  if (!fs.existsSync(registryPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(registryPath, 'utf-8')) as RegistryEntry[];
  } catch {
    return [];
  }
}

function writeRegistry(entries: RegistryEntry[]): void {
  const registryPath = Paths.registry();
  fs.mkdirSync(path.dirname(registryPath), { recursive: true });
  fs.writeFileSync(registryPath, JSON.stringify(entries, null, 2), 'utf-8');
}

export function addEntry(entry: Omit<RegistryEntry, 'id'>): RegistryEntry {
  const entries = readRegistry();
  const id = entries.length > 0 ? Math.max(...entries.map(e => e.id)) + 1 : 1;
  const newEntry: RegistryEntry = { id, ...entry };
  entries.push(newEntry);
  writeRegistry(entries);
  return newEntry;
}

export function updateEntryStatus(
  id: number,
  status: RegistryStatus,
  extra?: Partial<RegistryEntry>
): void {
  const entries = readRegistry();
  const idx = entries.findIndex(e => e.id === id);
  if (idx !== -1) {
    entries[idx] = { ...entries[idx], status, ...extra };
    writeRegistry(entries);
  }
}

export function getEntriesBySession(session_id: string): RegistryEntry[] {
  return readRegistry().filter(e => e.session_id === session_id);
}

export function getAllEntries(): RegistryEntry[] {
  return readRegistry();
}

export function getSessionList(): { session_id: string; count: number; failed: number; date: string }[] {
  const entries = readRegistry();
  const map = new Map<string, RegistryEntry[]>();
  for (const e of entries) {
    if (!map.has(e.session_id)) map.set(e.session_id, []);
    map.get(e.session_id)!.push(e);
  }
  return Array.from(map.entries()).map(([session_id, items]) => ({
    session_id,
    count: items.length,
    failed: items.filter(i => i.status === 'failed').length,
    date: session_id,
  })).reverse();
}
