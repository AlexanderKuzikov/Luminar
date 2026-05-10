import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api, type BatchJob, type BatchRetouchRequest, type RegistryEntry } from '@/api';

export const useBatchStore = defineStore('batch', () => {
  const currentJob = ref<BatchJob | null>(null);
  const results = ref<RegistryEntry[]>([]);
  const reviewIndex = ref(0);
  const isRunning = computed(() => currentJob.value?.status === 'running' || currentJob.value?.status === 'pending');
  let sse: EventSource | null = null;

  async function startBatch(req: BatchRetouchRequest) {
    const { jobId } = await api.startBatch(req);

    currentJob.value = {
      id: jobId,
      session_id: '',
      status: 'pending',
      total: req.source_files.length,
      completed: 0,
      failed: 0,
      items: req.source_files.map(f => ({ source_file: f, status: 'pending' })),
    };

    results.value = [];
    listenSSE(jobId);
  }

  function listenSSE(jobId: string) {
    sse?.close();
    sse = api.batchEvents(jobId);

    sse.onmessage = (e: MessageEvent) => {
      const event = JSON.parse(e.data as string);

      if (event.type === 'init') {
        currentJob.value = event.payload as BatchJob;
      }
      if (event.type === 'progress' || event.type === 'item_done' || event.type === 'item_failed') {
        if (currentJob.value) {
          currentJob.value = { ...currentJob.value, ...event.payload };
        }
      }
      if (event.type === 'batch_done') {
        if (currentJob.value) currentJob.value.status = 'done';
        sse?.close();
        // Перезагружаем историю
        loadRecentResults();
      }
      if (event.type === 'batch_cancelled') {
        if (currentJob.value) currentJob.value.status = 'cancelled';
        sse?.close();
      }
    };
  }

  async function cancelBatch() {
    if (!currentJob.value) return;
    await api.cancelBatch(currentJob.value.id);
  }

  async function loadRecentResults() {
    const entries = await api.getRegistry();
    // Берём последние 50 записей
    results.value = entries.slice(-50).reverse();
  }

  async function rejectResult(id: number) {
    await api.rejectEntry(id);
    const entry = results.value.find(r => r.id === id);
    if (entry) entry.status = 'rejected';
  }

  return { currentJob, results, reviewIndex, isRunning, startBatch, cancelBatch, loadRecentResults, rejectResult };
});
