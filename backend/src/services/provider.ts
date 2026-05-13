import OpenAI from 'openai';
import https from 'https';
import http from 'http';
import { getActiveProvider, getProviderById } from '../utils/config.js';
import { providerLogger } from '../utils/logger.js';
import type { Provider } from '../types.js';

const RETOUCH_STRENGTH_MAP = {
  soft:   0.3,
  medium: 0.6,
  strong: 0.9,
};

function makeClient(provider: Provider & { apiKey: string }): OpenAI {
  return new OpenAI({
    apiKey: provider.apiKey,
    baseURL: provider.baseURL,
  });
}

function fetchUrlAsBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('base64')));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function extractB64(item: { b64_json?: string | null; url?: string | null }): Promise<string | undefined> {
  if (item.b64_json) return item.b64_json;
  if (item.url) {
    providerLogger.log({ type: 'generate_url_fallback', url: item.url.slice(0, 80) });
    return fetchUrlAsBase64(item.url);
  }
  return undefined;
}

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

  const client = makeClient(provider as Provider & { apiKey: string });

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
    count: response.data?.length ?? 0,
    has_b64: !!response.data?.[0]?.b64_json,
    has_url: !!response.data?.[0]?.url,
  });

  if (!response.data || response.data.length === 0) {
    throw new Error('Запрос отклонён провайдером (возможно, ограничения авторских прав или контент-политика)');
  }

  const item = response.data[0];
  const b64 = await extractB64(item);
  if (!b64) throw new Error('API вернул изображение без данных (нет b64_json и url)');
  return b64;
}

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

  const client = makeClient(provider as Provider & { apiKey: string });
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

  let item: { b64_json?: string | null; url?: string | null } | undefined;

  if (strategy === 'edit') {
    const imageFile = await OpenAI.toFile(params.imageBuffer, 'image.jpg', { type: 'image/jpeg' });
    const response = await (client.images as any).edit({
      model: params.model,
      image: imageFile,
      prompt: params.prompt,
      size: params.size,
      n: 1,
      response_format: 'b64_json',
    });
    item = response.data?.[0];
  } else {
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
    item = response.data?.[0];
  }

  providerLogger.log({ type: 'retouch_response', provider: provider.id, has_b64: !!item?.b64_json, has_url: !!item?.url });

  if (!item) throw new Error('Запрос отклонён провайдером (возможно, ограничения авторских прав или контент-политика)');
  const b64 = await extractB64(item);
  if (!b64) throw new Error('API вернул изображение без данных (нет b64_json и url)');
  return b64;
}
