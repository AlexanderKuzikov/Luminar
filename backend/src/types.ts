// ─── Provider & Config ───────────────────────────────────────────────────────

export interface ProviderKey {
  id: string;
  label: string;
  envVar: string;
}

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
  active_key: string;
  keys: ProviderKey[];
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

// ─── Prompts ──────────────────────────────────────────────────────────────────

export interface Prompt {
  id: string;
  title: string;
  type: 'generate' | 'retouch';
  text: string;
  created_at: string;
  updated_at: string;
}

// ─── Registry ────────────────────────────────────────────────────────────────

export type RegistryStatus = 'success' | 'failed' | 'rejected';
export type JobType = 'retouch' | 'generate';

export interface RegistryEntry {
  id: number;
  session_id: string;
  type: JobType;
  source_file?: string;
  result_file: string;
  prompt_id: string;
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
  source_files: string[];
  prompt_id: string;
  model_id?: string;
  size?: string;
  quality?: string;
  retouch_preset: 'soft' | 'medium' | 'strong';
  output_mode: 'subfolder' | 'suffix';
  output_format: 'webp' | 'jpeg' | 'png';
  max_dimension: number;
}

export interface GenerateRequest {
  prompt_id?: string;
  prompt_text?: string;
  model_id?: string;
  size?: string;
  quality?: string;
  output_format?: 'webp' | 'jpeg' | 'png';
}

export interface SSEEvent {
  type: 'progress' | 'item_done' | 'item_failed' | 'batch_done' | 'batch_cancelled';
  payload: unknown;
}
