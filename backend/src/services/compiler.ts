import fs from 'fs';
import Handlebars from 'handlebars';
import { Paths } from '../utils/paths.js';
import type { Blueprint, Snippets } from '../types.js';

function loadSnippets(): Snippets {
  try {
    return JSON.parse(fs.readFileSync(Paths.snippets(), 'utf-8')) as Snippets;
  } catch {
    return {};
  }
}

function loadBlueprint(id: string): Blueprint {
  const filePath = `${Paths.blueprints()}/${id}.json`;
  if (!fs.existsSync(filePath)) {
    throw new Error(`Blueprint not found: ${id}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Blueprint;
}

/**
 * Компилирует Blueprint + Snippets → готовый объект для API.
 * Возвращает и скомпилированный Blueprint, и итоговую строку промпта (snapshot).
 */
export function compile(blueprintId: string, promptOverride?: string): {
  blueprint: Blueprint;
  promptSnapshot: string;
} {
  const snippets = loadSnippets();
  const raw = fs.readFileSync(`${Paths.blueprints()}/${blueprintId}.json`, 'utf-8');

  // Плоский контекст для Handlebars: { 'objects.example': '...', 'lighting.studio_soft': '...' }
  // и вложенный: { objects: { example: '...' } }
  const context: Record<string, unknown> = { ...snippets };

  const compiled = Handlebars.compile(raw)(context);
  const blueprint = JSON.parse(compiled) as Blueprint;

  // Собираем итоговый текст промпта
  const parts = [
    promptOverride ?? [blueprint.subject, blueprint.lighting, blueprint.environment, blueprint.camera]
      .filter(Boolean)
      .join(', '),
  ].filter(Boolean);

  const promptSnapshot = parts.join('. ');

  return { blueprint, promptSnapshot };
}

export function listBlueprints(): { id: string; title: string }[] {
  const dir = Paths.blueprints();
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      const id = f.replace('.json', '');
      try {
        const bp = JSON.parse(fs.readFileSync(`${dir}/${f}`, 'utf-8')) as { title?: string };
        return { id, title: bp.title ?? id };
      } catch {
        return { id, title: id };
      }
    });
}
