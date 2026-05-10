<template>
  <div class="review-compare">
    <div class="compare-header">
      <span>Before / After</span>
      <button class="icon-btn" @click="$emit('close')">
        <X :size="16" />
      </button>
    </div>
    <div class="compare-body">
      <div class="compare-panel">
        <div class="compare-label">Оригинал</div>
        <img
          v-if="entry.source_file"
          :src="api.imageUrl(entry.source_file)"
          class="compare-img"
        />
      </div>
      <div class="compare-divider"></div>
      <div class="compare-panel">
        <div class="compare-label">Результат</div>
        <img
          :src="api.imageUrl(entry.result_file)"
          class="compare-img"
        />
      </div>
    </div>
    <div class="compare-footer">
      <div class="prompt-snippet">{{ entry.prompt_snapshot }}</div>
      <button class="btn-reject" @click="reject">
        <ThumbsDown :size="13" />
        Отклонить
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { X, ThumbsDown } from 'lucide-vue-next';
import { useBatchStore } from '@/stores/batch';
import { api, type RegistryEntry } from '@/api';

const props = defineProps<{ entry: RegistryEntry }>();
const emit = defineEmits<{ (e: 'close'): void }>();

const batch = useBatchStore();

async function reject() {
  await batch.rejectResult(props.entry.id);
  emit('close');
}
</script>

<style scoped>
.review-compare { display: flex; flex-direction: column; height: 100%; background: var(--color-bg-base); }
.compare-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--color-bg-surface); border-bottom: 1px solid var(--color-border); font-size: 13px; font-weight: 600; }
.compare-body { flex: 1; display: flex; overflow: hidden; }
.compare-panel { flex: 1; display: flex; flex-direction: column; overflow: hidden; align-items: center; justify-content: center; gap: 8px; padding: 16px; }
.compare-label { font-size: 11px; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
.compare-img { max-width: 100%; max-height: calc(100vh - 180px); object-fit: contain; border-radius: 6px; }
.compare-divider { width: 1px; background: var(--color-border); flex-shrink: 0; }
.compare-footer { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: var(--color-bg-surface); border-top: 1px solid var(--color-border); }
.prompt-snippet { flex: 1; font-size: 12px; color: var(--color-text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.btn-reject { display: flex; align-items: center; gap: 5px; padding: 6px 12px; background: none; border: 1px solid var(--color-danger); color: var(--color-danger); border-radius: 6px; font-size: 12px; font-family: inherit; cursor: pointer; transition: background 0.15s; }
.btn-reject:hover { background: rgba(240,82,82,0.1); }
.icon-btn { background: none; border: none; color: var(--color-text-muted); cursor: pointer; padding: 4px; border-radius: 4px; display: flex; align-items: center; }
.icon-btn:hover { color: var(--color-text); }
</style>
