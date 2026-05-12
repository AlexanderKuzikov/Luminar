import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { preProcess, postProcess, buildOutputPath } from './sharp-processor.js';
import { retouch } from './provider.js';
import { addEntry } from '../utils/registry.js';
import { getActiveProvider } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { Paths } from '../utils/paths.js';
import type { BatchJob, BatchRetouchRequest, Prompt } from '../types.js';

const RETRY_DELAYS = [1000, 2000, 4000];

const activeBatches = new Map<string, BatchJob>();
const sseClients = new Map<string, ((event: string) => void)[]>();

function readPrompts(): Prompt[] {
  const file = Paths.prompts();
  if (!fs.existsSync(file)) return [];
  try { return JSON.parse(fs.readFileSync(file, 'utf-8')); } catch { return []; }
}

function emit(jobId: string, event: object): void {
  const clients = sseClients.get(jobId) ?? [];
  const data = `data: ${JSON.stringify(event)}\n\n`;
  clients.forEach(send => send(data));
}

export function registerSSEClient(jobId: string, send: (data: string) => void): () => void {
  if (!sseClients.has(jobId)) sseClients.set(jobId, []);
  sseClients.get(jobId)!.push(send);
  return () => {
    const list = sseClients.get(jobId) ?? [];
    sseClients.set(jobId, list.filter(fn => fn !== send));
  };
}

export function getJob(jobId: string): BatchJob | undefined {
  return activeBatches.get(jobId);
}

export function cancelJob(jobId: string): boolean {
  const job = activeBatches.get(jobId);
  if (!job || job.status !== 'running') return false;
  job.status = 'cancelled';
  emit(jobId, { type: 'batch_cancelled', payload: { jobId } });
  return true;
}

async function retryApiCall<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i <= RETRY_DELAYS.length; i++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const status = (err as any)?.status;
      if ((status === 429 || (status >= 500 && status < 600)) && i < RETRY_DELAYS.length) {
        logger.warn(`[batch] API error ${status}, retry in ${RETRY_DELAYS[i]}ms...`);
        await new Promise(r => setTimeout(r, RETRY_DELAYS[i]));
      } else {
        break;
      }
    }
  }
  throw lastError;
}

export async function startBatchRetouch(req: BatchRetouchRequest): Promise<string> {
  const jobId = uuidv4();
  const sessionId = new Date().toISOString();
  const provider = getActiveProvider();
  if (!provider) throw new Error('No active provider configured');

  // Resolve prompt
  const prompts = readPrompts();
  const prompt = prompts.find(p => p.id === req.prompt_id);
  if (!prompt) throw new Error(`Prompt not found: ${req.prompt_id}`);
  const promptSnapshot = prompt.text;

  // Model params: request > provider.models[0]
  const model   = req.model_id  ?? provider.models[0]?.id        ?? '';
  const size    = req.size      ?? provider.models[0]?.sizes[0]  ?? '1024x1024';
  const quality = req.quality   ?? provider.models[0]?.quality[0] ?? 'standard';

  const job: BatchJob = {
    id: jobId,
    session_id: sessionId,
    status: 'pending',
    total: req.source_files.length,
    completed: 0,
    failed: 0,
    items: req.source_files.map(f => ({ source_file: f, status: 'pending' })),
  };
  activeBatches.set(jobId, job);

  setImmediate(async () => {
    job.status = 'running';

    for (const item of job.items) {
      if (job.status === 'cancelled') break;

      item.status = 'processing';
      emit(jobId, { type: 'progress', payload: { jobId, item: item.source_file, completed: job.completed, total: job.total } });

      try {
        const { buffer } = await preProcess(item.source_file, req.max_dimension);

        const b64 = await retryApiCall(() =>
          retouch({
            imageBuffer: buffer,
            prompt: promptSnapshot,
            model,
            size,
            quality,
            preset: req.retouch_preset,
          })
        );

        const outputPath = buildOutputPath(item.source_file, req.output_mode, req.output_format);
        await postProcess(b64, outputPath, req.output_format);

        item.status = 'success';
        item.result_file = outputPath;
        job.completed++;

        addEntry({
          session_id: sessionId,
          type: 'retouch',
          source_file: item.source_file,
          result_file: outputPath,
          prompt_id: req.prompt_id,
          prompt_snapshot: promptSnapshot,
          provider_id: provider.id,
          model,
          retouch_strategy: provider.retouch_strategy,
          retouch_preset: req.retouch_preset,
          params: { size, quality },
          status: 'success',
          created_at: new Date().toISOString(),
        });

        emit(jobId, {
          type: 'item_done',
          payload: { source_file: item.source_file, result_file: outputPath, completed: job.completed, total: job.total },
        });
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        item.status = 'failed';
        item.error = errorMsg;
        job.failed++;

        addEntry({
          session_id: sessionId,
          type: 'retouch',
          source_file: item.source_file,
          result_file: '',
          prompt_id: req.prompt_id,
          prompt_snapshot: promptSnapshot,
          provider_id: provider.id,
          model,
          retouch_strategy: provider.retouch_strategy,
          retouch_preset: req.retouch_preset,
          params: { size, quality },
          status: 'failed',
          error: errorMsg,
          created_at: new Date().toISOString(),
        });

        logger.error(`[batch] Failed: ${item.source_file} — ${errorMsg}`);
        emit(jobId, { type: 'item_failed', payload: { source_file: item.source_file, error: errorMsg } });
      }
    }

    if (job.status !== 'cancelled') job.status = 'done';
    emit(jobId, { type: 'batch_done', payload: { jobId, completed: job.completed, failed: job.failed } });
    logger.info(`[batch] Done. Completed: ${job.completed}, Failed: ${job.failed}`);
  });

  return jobId;
}
