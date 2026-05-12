import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api, type BatchJob, type BatchRetouchRequest } from '@/api';

export const useBatchStore = defineStore('batch', () => {
  const currentJob = ref<BatchJob | null>(null);
  const isRunning = ref(false);
  let eventSource: EventSource | null = null;

  async function startBatch(data: BatchRetouchRequest) {
    isRunning.value = true;
    currentJob.value = null;

    try {
      const { jobId } = await api.startBatch(data);
      const job = await api.getBatch(jobId);
      currentJob.value = job;

      eventSource?.close();
      eventSource = api.batchEvents(jobId);

      eventSource.onmessage = (e) => {
        const event = JSON.parse(e.data);
        if (!currentJob.value) return;

        if (event.type === 'progress') {
          currentJob.value.completed = event.payload.completed;
        } else if (event.type === 'item_done') {
          const item = currentJob.value.items.find(i => i.source_file === event.payload.source_file);
          if (item) { item.status = 'success'; item.result_file = event.payload.result_file; }
          currentJob.value.completed = event.payload.completed;
        } else if (event.type === 'item_failed') {
          const item = currentJob.value.items.find(i => i.source_file === event.payload.source_file);
          if (item) { item.status = 'failed'; item.error = event.payload.error; }
        } else if (event.type === 'batch_done' || event.type === 'batch_cancelled') {
          currentJob.value.status = event.type === 'batch_done' ? 'done' : 'cancelled';
          isRunning.value = false;
          eventSource?.close();
        }
      };
    } catch (err) {
      isRunning.value = false;
      throw err;
    }
  }

  async function cancelBatch() {
    if (!currentJob.value) return;
    await api.cancelBatch(currentJob.value.id);
  }

  return { currentJob, isRunning, startBatch, cancelBatch };
});
