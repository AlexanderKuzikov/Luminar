const BASE = '/api';

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Files
  selectFolder: () => request<{ cancelled: boolean; path: string | null; files: FileEntry[] }>('GET', '/files/select-folder'),
  scanFolder:   (path: string) => request<{ path: string; files: FileEntry[] }>('GET', `/files/scan-folder?path=${encodeURIComponent(path)}`),
  imageUrl:     (path: string) => `/api/files/image?path=${encodeURIComponent(path)}`,

  // Prompts
  listPrompts:   (type?: 'generate' | 'retouch') => request<Prompt[]>('GET', `/prompts${type ? `?type=${type}` : ''}`),
  createPrompt:  (data: Pick<Prompt, 'title' | 'type' | 'text'>) => request<Prompt>('POST', '/prompts', data),
  updatePrompt:  (id: string, data: Partial<Pick<Prompt, 'title' | 'text'>>) => request<Prompt>('PUT', `/prompts/${id}`, data),
  deletePrompt:  (id: string) => request<{ ok: boolean }>('DELETE', `/prompts/${id}`),

  // Config
  getConfig:  () => request<AppConfig>('GET', '/config'),
  saveConfig: (data: unknown) => request<{ ok: boolean }>('PUT', '/config', data),

  // Batch
  startBatch:  (data: BatchRetouchRequest) => request<{ jobId: string }>('POST', '/batch/retouch', data),
  getBatch:    (id: string) => request<BatchJob>('GET', `/batch/${id}`),
  cancelBatch: (id: string) => request<{ cancelled: boolean }>('DELETE', `/batch/${id}`),

  // Generate
  generate: (data: GenerateRequest) =>
    request<{ entry: RegistryEntry; result_file: string }>('POST', '/generate', data),

  // Registry
  getRegistry: () => request<RegistryEntry[]>('GET', '/registry'),
  getSessions: () => request<SessionMeta[]>('GET', '/registry/sessions'),
  rejectEntry: (id: number) => request<{ ok: boolean }>('PATCH', `/registry/${id}/reject`),

  // SSE
  batchEvents: (jobId: string) => new EventSource(`/api/batch/${jobId}/events`),
};

// --- Types ---

export interface FileEntry { name: string; path: string; size: number; }

export interface Prompt {
  id: string;
  title: string;
  type: 'generate' | 'retouch';
  text: string;
  created_at: string;
  updated_at: string;
}

export interface ProviderKey {
  id: string;
  label: string;
  envVar: string;
  configured: boolean;
}

export interface ModelConfig {
  id: string;
  name: string;
  modes: string[];
  sizes: string[];
  quality: string[];
}

export interface ProviderConfig {
  id: string;
  name: string;
  baseURL: string;
  active_key: string;
  keys: ProviderKey[];
  retouch_strategy: 'edit' | 'generate';
  models: ModelConfig[];
}

export interface UIConfig {
  theme: string;
  default_output: string;
}

export interface AppConfig {
  port: number;
  active_provider: string;
  ui: UIConfig;
  providers: ProviderConfig[];
}

export interface GenerateRequest {
  prompt_id?: string;
  prompt_text?: string;
  model_id?: string;
  size?: string;
  quality?: string;
  output_format?: 'webp' | 'jpeg' | 'png';
}

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

export interface BatchJob {
  id: string; session_id: string; status: string;
  total: number; completed: number; failed: number;
  items: BatchItem[];
}

export interface BatchItem {
  source_file: string; status: string;
  result_file?: string; error?: string;
}

export interface RegistryEntry {
  id: number; session_id: string; type: string;
  source_file?: string; result_file: string;
  prompt_id: string; prompt_snapshot: string;
  provider_id: string; model: string;
  retouch_preset?: string; status: string;
  error?: string; created_at: string;
}

export interface SessionMeta {
  session_id: string; count: number; failed: number; date: string;
}
