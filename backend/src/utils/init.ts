import fs from 'fs';
import path from 'path';
import { getDataDir, Paths } from './paths.js';
import { logger } from './logger.js';

const DEFAULT_SNIPPETS = {
  objects: {
    example: 'Describe your object here in detail'
  },
  lighting: {
    studio_soft: 'Soft studio lighting, diffused key light from 45 degrees, fill light, no harsh shadows'
  },
  environments: {
    white_bg: 'Clean white background, studio setting'
  }
};

const DEFAULT_BLUEPRINT = {
  title: 'Example Blueprint',
  subject: '{{ objects.example }}',
  lighting: '{{ lighting.studio_soft }}',
  environment: '{{ environments.white_bg }}',
  camera: 'Product photography, sharp focus, 4:3',
  negative_prompt: 'blur, noise, watermark, text',
  params: {
    size: '1024x1024',
    quality: 'standard',
    model: 'gemini-3-pro-image'
  }
};

export function initDataDir(): void {
  const dataDir = getDataDir();

  // Создаём все папки сразу, до любого обращения к logger
  const dirs = [
    dataDir,
    Paths.logs(),
    Paths.blueprints(),
    Paths.media(),
  ];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // logger готов к использованию только после создания папок
  logger.info(`[init] Data directory: ${dataDir}`);

  if (!fs.existsSync(Paths.snippets())) {
    fs.writeFileSync(Paths.snippets(), JSON.stringify(DEFAULT_SNIPPETS, null, 2), 'utf-8');
    logger.info('[init] Created default snippets.json');
  }

  const exampleBlueprint = path.join(Paths.blueprints(), 'example.json');
  if (!fs.existsSync(exampleBlueprint)) {
    fs.writeFileSync(exampleBlueprint, JSON.stringify(DEFAULT_BLUEPRINT, null, 2), 'utf-8');
    logger.info('[init] Created example blueprint');
  }

  if (!fs.existsSync(Paths.registry())) {
    fs.writeFileSync(Paths.registry(), '[]', 'utf-8');
    logger.info('[init] Created empty registry.json');
  }
}
