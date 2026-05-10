import OpenAI from 'openai';
import fs from 'fs';
import FormData from 'form-data';
import { getActiveProvider, getProviderById } from '../utils/config.js';
import { providerLogger } from '../utils/logger.js';
import type { Provider } from '../types.js';

const RETOUCH_STRENGTH_MAP = {
  soft:   0.3,
  medium: 0.6,
  strong: 0.9,
};

function makeClient(provider: Provider): OpenAI {
  return new OpenAI({
    apiKey: provider.apiKey,
    baseURL: provider.baseURL,
  });
}

/**
 * Генерация с нуля (Text-to-Image).
 */
export async function generate(params: {
  providerId?: string;
  prompt: string;
  model: string;
  size: string;
  quality: string;
  n?: number;
}): Promise<string> {
  const provider = params.providerId
    ? getProviderById(params.providerId)
    : getActiveProvider();

  if (!provider) throw new Error('No active provider configured');

  const client = makeClient(provider);

  const requestPayload = {
    model: params.model,
    prompt: params.prompt,
    size: params.size as '1024x1024',
    n: params.n ?? 1,
    quality: params.quality,
    response_format: 'b64_json' as const,
  };

  providerLogger.log({ type: 'generate_request', provider: provider.id, ...requestPayload });

  const response = await client.images.generate(requestPayload);

  providerLogger.log({
    type: 'generate_response',
    provider: provider.id,
    count: response.data?.length,
  });

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) throw new Error('API returned no image data');
  return b64;
}

/**
 * Ретушь (Img2Img).
 * Переключается между стратегиями edit / generate на основе config.
 */
export async function retouch(params: {
  providerId?: string;
  imageBuffer: Buffer;
  prompt: string;
  model: string;
  size: string;
  quality: string;
  preset: 'soft' | 'medium' | 'strong';
}): Promise<string> {
  const provider = params.providerId
    ? getProviderById(params.providerId)
    : getActiveProvider();

  if (!provider) throw new Error('No active provider configured');

  const client = makeClient(provider);
  const strength = RETOUCH_STRENGTH_MAP[params.preset];
  const strategy = provider.retouch_strategy ?? 'edit';

  providerLogger.log({
    type: 'retouch_request',
    provider: provider.id,
    strategy,
    preset: params.preset,
    strength,
    model: params.model,
    size: params.size,
  });

  let b64: string | undefined;

  if (strategy === 'edit') {
    // Стратегия 1: /v1/images/edits — стандартный OpenAI Img2Img
    // openai SDK ожидает File-like объект или путь, передаём через toFile
    const imageFile = await OpenAI.toFile(params.imageBuffer, 'image.jpg', { type: 'image/jpeg' });
    const response = await (client.images as any).edit({
      model: params.model,
      image: imageFile,
      prompt: params.prompt,
      size: params.size,
      n: 1,
      response_format: 'b64_json',
    });
    b64 = response.data?.[0]?.b64_json;
  } else {
    // Стратегия 2: /v1/images/generations — fallback
    // Исходное изображение кодируем в base64 data URL и добавляем в промпт
    const b64source = params.imageBuffer.toString('base64');
    const dataUrl = `data:image/jpeg;base64,${b64source}`;
    const augmentedPrompt = `${params.prompt}\n\n[Source image]: ${dataUrl}`;

    const response = await client.images.generate({
      model: params.model,
      prompt: augmentedPrompt,
      size: params.size as '1024x1024',
      n: 1,
      quality: params.quality,
      response_format: 'b64_json',
    });
    b64 = response.data?.[0]?.b64_json;
  }

  providerLogger.log({ type: 'retouch_response', provider: provider.id, success: !!b64 });

  if (!b64) throw new Error('API returned no image data');
  return b64;
}
