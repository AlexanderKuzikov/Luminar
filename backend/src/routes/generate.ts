import express from 'express';
import path from 'path';
import { compile } from '../services/compiler.js';
import { generate } from '../services/provider.js';
import { postProcess, buildOutputPath } from '../services/sharp-processor.js';
import { addEntry } from '../utils/registry.js';
import { getActiveProvider } from '../utils/config.js';
import { Paths } from '../utils/paths.js';
import type { GenerateRequest } from '../types.js';

const router = express.Router();

// POST /api/generate
router.post('/', async (req, res) => {
  try {
    const body = req.body as GenerateRequest;
    if (!body.blueprint_id) {
      return res.status(400).json({ error: 'blueprint_id required' });
    }

    const provider = getActiveProvider();
    if (!provider) return res.status(400).json({ error: 'No active provider configured' });

    const { blueprint, promptSnapshot } = compile(body.blueprint_id, body.prompt_override);
    const model = blueprint.params.model ?? provider.models[0]?.id ?? '';
    const size = blueprint.params.size ?? '1024x1024';
    const quality = blueprint.params.quality ?? 'low';
    const sessionId = new Date().toISOString();

    const b64 = await generate({ prompt: promptSnapshot, model, size, quality });

    const outputPath = path.join(Paths.media(), `gen_${Date.now()}.png`);
    await postProcess(b64, outputPath, 'png');

    const entry = addEntry({
      session_id: sessionId,
      type: 'generate',
      result_file: outputPath,
      blueprint_id: body.blueprint_id,
      prompt_snapshot: promptSnapshot,
      provider_id: provider.id,
      model,
      params: { size, quality },
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
