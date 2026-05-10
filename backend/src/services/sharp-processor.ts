import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

export type OutputFormat = 'webp' | 'jpeg' | 'png';

export interface PreProcessResult {
  buffer: Buffer;
  originalWidth: number;
  originalHeight: number;
  wasResized: boolean;
}

/**
 * Читает файл, при необходимости ресайзит.
 * Возвращает JPEG-буфер (для отправки в API).
 */
export async function preProcess(
  absolutePath: string,
  maxDimension: number
): Promise<PreProcessResult> {
  const image = sharp(absolutePath);
  const meta = await image.metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;

  let pipeline = sharp(absolutePath);
  let wasResized = false;

  if (maxDimension > 0 && (w > maxDimension || h > maxDimension)) {
    pipeline = pipeline.resize({
      width: maxDimension,
      height: maxDimension,
      fit: 'inside',
      withoutEnlargement: true,
    });
    wasResized = true;
  }

  const buffer = await pipeline.jpeg({ quality: 92 }).toBuffer();
  return { buffer, originalWidth: w, originalHeight: h, wasResized };
}

/**
 * Принимает base64-строку из ответа API,
 * конвертирует в нужный формат и сохраняет на диск.
 */
export async function postProcess(
  b64: string,
  outputPath: string,
  format: OutputFormat,
  quality = 85
): Promise<void> {
  const inputBuffer = Buffer.from(b64, 'base64');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  let pipeline = sharp(inputBuffer);

  switch (format) {
    case 'webp':
      pipeline = pipeline.webp({ quality });
      break;
    case 'jpeg':
      pipeline = pipeline.jpeg({ quality });
      break;
    case 'png':
      pipeline = pipeline.png();
      break;
  }

  await pipeline.toFile(outputPath);
}

/**
 * Строит путь для сохранения результата.
 */
export function buildOutputPath(
  sourceFile: string,
  outputMode: 'subfolder' | 'suffix',
  format: OutputFormat
): string {
  const dir = path.dirname(sourceFile);
  const base = path.basename(sourceFile, path.extname(sourceFile));
  const ext = format === 'jpeg' ? 'jpg' : format;

  if (outputMode === 'subfolder') {
    return path.join(dir, 'processed', `${base}.${ext}`);
  }
  return path.join(dir, `${base}_retouched.${ext}`);
}
