import express from 'express';
import path from 'path';
import fs from 'fs';
import { generate } from '../services/provider.js';
import { postProcess, buildOutputPath } from '../services/sharp-processor.js';
import { addEntry } from '../utils/registry.js';
import { getActiveProvider } from '../utils/config.js';
import { Paths } from '../utils/paths.js';
import { providerLogger } from '../utils/logger.js';
import type { GenerateRequest, Prompt } from '../types.js';

const router = express.Router();

function readPrompts(): Prompt[] {
  const file = Paths.prompts();
  if (!fs.existsSync(file)) return [];
  try { return JSON.parse(fs.readFileSync(file, 'utf-8')); } catch { return []; }
}

// POST /api/generate
router.post('/', async (req, res) => {
  try {
    const body = req.body as GenerateRequest;

    providerLogger.log({
      type: 'generate_incoming',
      prompt_id: body.prompt_id,
      has_prompt_text: !!body.prompt_text?.trim(),
      model_id: body.model_id,
      size: body.size,
      quality: body.quality,
      output_format: body.output_format,
    });

    // Resolve prompt text
    let promptText = '';
    let promptId = body.prompt_id ?? '';
    if (body.prompt_text?.trim()) {
      promptText = body.prompt_text.trim();
      promptId = 'inline';
    } else if (body.prompt_id) {
      const prompt = readPrompts().find(p => p.id === body.prompt_id);
      if (!prompt) return res.status(400).json({ error: 'Prompt not found' });
      promptText = prompt.text;
    } else {
      return res.status(400).json({ error: 'prompt_id or prompt_text required' });
    }

    const provider = getActiveProvider();
    if (!provider) return res.status(400).json({ error: 'No active provider configured' });
    const apiKey = (provider as any).apiKey;
    if (!apiKey) return res.status(400).json({ error: `API key not set` });

    // Model params: body > provider.models[0]
    const model   = body.model_id  ?? provider.models[0]?.id       ?? '';
    const size    = body.size      ?? provider.models[0]?.sizes[0]  ?? '1024x1024';
    const quality = body.quality   ?? provider.models[0]?.quality[0] ?? 'standard';
    const format  = body.output_format ?? 'webp';

    providerLogger.log({
      type: 'generate_resolved',
      model,
      size,
      quality,
      format,
      promptText: promptText.slice(0, 80),
    });

    const sessionId = new Date().toISOString();
    const b64 = await generate({ prompt: promptText, model, size, quality });

    const outputPath = path.join(Paths.media(), `gen_${Date.now()}.${format}`);
    await postProcess(b64, outputPath, format);

    const entry = addEntry({
      session_id: sessionId,
      type: 'generate',
      result_file: outputPath,
      prompt_id: promptId,
      prompt_snapshot: promptText,
      provider_id: provider.id,
      model,
      params: { size, quality, format },
      status: 'success',
      created_at: new Date().toISOString(),
    });

    res.json({ entry, result_file: outputPath });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

export default router;
