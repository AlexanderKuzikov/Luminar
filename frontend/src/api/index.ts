// Единая точка для всех fetch-запросов к бэкенду

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

  // Blueprints
  listBlueprints: () => request<BlueprintMeta[]>('GET', '/blueprints'),
  getBlueprint:   (id: string) => request<unknown>('GET', `/blueprints/${id}`),
  saveBlueprint:  (id: string, data: unknown) => request<{ ok: boolean }>('PUT', `/blueprints/${id}`, data),
  createBlueprint:(data: unknown) => request<{ ok: boolean; id: string }>('POST', '/blueprints', data),
  deleteBlueprint:(id: string) => request<{ ok: boolean }>('DELETE', `/blueprints/${id}`),

  // Snippets
  getSnippets:  () => request<Record<string, Record<string, string>>>('GET', '/snippets'),
  saveSnippets: (data: unknown) => request<{ ok: boolean }>('PUT', '/snippets', data),

  // Config
  getConfig:  () => request<AppConfig>('GET', '/config'),
  saveConfig: (data: unknown) => request<{ ok: boolean }>('PUT', '/config', data),

  // Batch
  startBatch: (data: BatchRetouchRequest) => request<{ jobId: string }>('POST', '/batch/retouch', data),
  getBatch:   (id: string) => request<BatchJob>('GET', `/batch/${id}`),
  cancelBatch:(id: string) => request<{ cancelled: boolean }>('DELETE', `/batch/${id}`),

  // Generate
  generate: (data: { blueprint_id: string; prompt_override?: string }) =>
    request<{ entry: unknown; result_file: string }>('POST', '/generate', data),

  // Registry
  getRegistry:  () => request<RegistryEntry[]>('GET', '/registry'),
  getSessions:  () => request<SessionMeta[]>('GET', '/registry/sessions'),
  rejectEntry:  (id: number) => request<{ ok: boolean }>('PATCH', `/registry/${id}/reject`),

  // SSE
  batchEvents: (jobId: string) => new EventSource(`/api/batch/${jobId}/events`),
};

// --- Types (mirrors backend) ---
export interface FileEntry { name: string; path: string; size: number; }
export interface BlueprintMeta { id: string; title: string; }
export interface AppConfig {
  active_provider: string;
  ui: { theme: string; default_output: string };
  providers: ProviderConfig[];
}
export interface ProviderConfig {
  id: string; name: string; baseURL: string; apiKey: string;
  retouch_strategy: 'edit' | 'generate';
  models: ModelConfig[];
}
export interface ModelConfig {
  id: string; name: string; modes: string[];
  sizes: string[]; quality: string[];
}
export interface BatchRetouchRequest {
  source_files: string[];
  blueprint_id: string;
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
  blueprint_id: string; prompt_snapshot: string;
  provider_id: string; model: string;
  retouch_preset?: string; status: string;
  error?: string; created_at: string;
}
export interface SessionMeta {
  session_id: string; count: number; failed: number; date: string;
}
