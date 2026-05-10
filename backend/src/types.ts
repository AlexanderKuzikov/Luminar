// ─── Provider & Config ───────────────────────────────────────────────────────

export interface ProviderModel {
  id: string;
  name: string;
  modes: ('generate' | 'retouch')[];
  sizes: string[];
  quality: string[];
}

export interface Provider {
  id: string;
  name: string;
  baseURL: string;
  apiKey: string;
  retouch_strategy: 'edit' | 'generate';
  models: ProviderModel[];
}

export interface UIConfig {
  theme: 'dark' | 'light';
  default_output: 'subfolder' | 'suffix';
}

export interface AppConfig {
  port: number;
  active_provider: string;
  providers: Provider[];
  ui: UIConfig;
}

// ─── Blueprint & Snippets ─────────────────────────────────────────────────────

export interface BlueprintParams {
  size?: string;
  quality?: string;
  model?: string;
  [key: string]: unknown;
}

export interface Blueprint {
  title: string;
  subject?: string;
  environment?: string;
  lighting?: string;
  camera?: string;
  negative_prompt?: string;
  params: BlueprintParams;
}

export type Snippets = Record<string, Record<string, string>>;

// ─── Registry ────────────────────────────────────────────────────────────────

export type RegistryStatus = 'success' | 'failed' | 'rejected';
export type JobType = 'retouch' | 'generate';

export interface RegistryEntry {
  id: number;
  session_id: string;
  type: JobType;
  source_file?: string;
  result_file: string;
  blueprint_id: string;
  prompt_snapshot: string;
  provider_id: string;
  model: string;
  retouch_strategy?: 'edit' | 'generate';
  retouch_preset?: 'soft' | 'medium' | 'strong';
  params: Record<string, unknown>;
  status: RegistryStatus;
  error?: string;
  created_at: string;
}

// ─── Batch Job ────────────────────────────────────────────────────────────────

export type BatchStatus = 'pending' | 'running' | 'done' | 'cancelled';

export interface BatchJob {
  id: string;
  session_id: string;
  status: BatchStatus;
  total: number;
  completed: number;
  failed: number;
  items: BatchItem[];
}

export interface BatchItem {
  source_file: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  result_file?: string;
  error?: string;
}

// ─── API Request/Response ─────────────────────────────────────────────────────

export interface BatchRetouchRequest {
  source_files: string[];    // Абсолютные пути к исходным файлам
  blueprint_id: string;
  retouch_preset: 'soft' | 'medium' | 'strong';
  output_mode: 'subfolder' | 'suffix';
  output_format: 'webp' | 'jpeg' | 'png';
  max_dimension: number;     // 0 = без ресайза
}

export interface GenerateRequest {
  blueprint_id: string;
  prompt_override?: string;  // Если юзер отредактировал промпт в Monaco
}

export interface SSEEvent {
  type: 'progress' | 'item_done' | 'item_failed' | 'batch_done' | 'batch_cancelled';
  payload: unknown;
}
