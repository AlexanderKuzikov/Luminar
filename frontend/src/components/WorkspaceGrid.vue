<template>
  <div class="workspace-grid">
    <div v-if="!files.selected.size" class="grid-empty">
      <ImageIcon :size="48" class="empty-icon" />
      <p>Выберите файлы в левой панели</p>
    </div>

    <div v-else class="grid-items">
      <div
        v-for="path in selectedFiles"
        :key="path"
        class="grid-item"
        @dblclick="openPreview(path)"
      >
        <img :src="api.imageUrl(path)" class="grid-img" loading="lazy" />
        <div class="grid-item-name">{{ basename(path) }}</div>

        <!-- Если есть результат — показываем бейдж -->
        <div v-if="resultFor(path)" class="result-badge" @click.stop="$emit('review', resultFor(path)!)">
          <CheckCircle :size="12" />
          Готово
        </div>
      </div>
    </div>

    <!-- Fullscreen preview -->
    <div v-if="previewPath" class="fullscreen" @click="previewPath = null">
      <img :src="api.imageUrl(previewPath)" class="fullscreen-img" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ImageIcon, CheckCircle } from 'lucide-vue-next';
import { useFilesStore } from '@/stores/files';
import { useBatchStore } from '@/stores/batch';
import { api, type RegistryEntry } from '@/api';

const emit = defineEmits<{ (e: 'review', entry: RegistryEntry): void }>();

const files = useFilesStore();
const batch = useBatchStore();
const previewPath = ref<string | null>(null);

const selectedFiles = computed(() => Array.from(files.selected));

function resultFor(path: string): RegistryEntry | undefined {
  return batch.results.find(r => r.source_file === path && r.status === 'success');
}

function basename(p: string) {
  return p.split(/[\\/]/).pop() ?? p;
}

function openPreview(path: string) {
  previewPath.value = path;
}
</script>

<style scoped>
.workspace-grid { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.grid-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: var(--color-text-muted); font-size: 14px; }
.empty-icon { opacity: 0.2; }
.grid-items { flex: 1; overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; padding: 12px; align-content: start; }
.grid-item { position: relative; background: var(--color-bg-panel); border-radius: 8px; overflow: hidden; cursor: pointer; border: 1px solid var(--color-border); transition: border-color 0.15s; }
.grid-item:hover { border-color: var(--color-accent); }
.grid-img { width: 100%; aspect-ratio: 1; object-fit: cover; display: block; }
.grid-item-name { padding: 5px 7px; font-size: 11px; color: var(--color-text-muted); font-family: monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.result-badge { position: absolute; top: 6px; right: 6px; display: flex; align-items: center; gap: 4px; padding: 3px 7px; background: var(--color-success); color: white; border-radius: 4px; font-size: 11px; font-weight: 600; cursor: pointer; }
.fullscreen { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 9999; display: flex; align-items: center; justify-content: center; cursor: zoom-out; }
.fullscreen-img { max-width: 95vw; max-height: 95vh; object-fit: contain; border-radius: 8px; }
</style>
