<template>
  <aside class="source-explorer">
    <div class="explorer-header">
      <button class="btn-folder" @click="files.selectFolder()" :disabled="files.loading">
        <FolderOpen :size="14" />
        {{ files.currentFolder ? 'Сменить папку' : 'Выбрать папку' }}
      </button>
    </div>

    <div v-if="files.currentFolder" class="folder-path" :title="files.currentFolder">
      {{ folderName }}
    </div>

    <div v-if="files.files.length" class="bulk-actions">
      <button class="action-link" @click="files.selectAll()">Все</button>
      <button class="action-link" @click="files.selectNone()">Сброс</button>
      <button class="action-link" @click="files.invertSelection()">Инверт</button>
      <span class="selected-count">
        {{ files.selected.size }} / {{ files.files.length }}
      </span>
    </div>

    <!-- Поиск -->
    <div v-if="files.files.length" class="search-wrap">
      <Search :size="12" class="search-icon" />
      <input v-model="search" class="search-input" placeholder="Фильтр..." />
    </div>

    <!-- Список файлов -->
    <div class="file-list">
      <div
        v-for="file in filteredFiles"
        :key="file.path"
        class="file-item"
        :class="{ selected: files.selected.has(file.path) }"
        @click="files.toggleSelect(file.path)"
      >
        <div class="file-thumb-wrap">
          <img
            :src="api.imageUrl(file.path)"
            class="file-thumb"
            loading="lazy"
          />
          <div class="file-checkbox">
            <Check v-if="files.selected.has(file.path)" :size="10" />
          </div>
        </div>
        <div class="file-name" :title="file.name">{{ file.name }}</div>
      </div>
    </div>

    <div v-if="!files.currentFolder" class="explorer-empty">
      <FolderOpen :size="32" class="empty-icon" />
      <p>Выберите папку с изображениями</p>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { FolderOpen, Search, Check } from 'lucide-vue-next';
import { useFilesStore } from '@/stores/files';
import { api } from '@/api';

const files = useFilesStore();
const search = ref('');

const folderName = computed(() => {
  const p = files.currentFolder;
  return p ? p.split(/[\\/]/).pop() ?? p : '';
});

const filteredFiles = computed(() =>
  search.value
    ? files.files.filter(f => f.name.toLowerCase().includes(search.value.toLowerCase()))
    : files.files
);
</script>

<style scoped>
.source-explorer {
  width: 280px;
  min-width: 280px;
  background: var(--color-bg-surface);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.explorer-header { padding: 10px; border-bottom: 1px solid var(--color-border); }
.btn-folder {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
  padding: 8px;
  background: var(--color-bg-panel);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  border-radius: 6px;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-folder:hover { background: var(--color-bg-hover); }
.btn-folder:disabled { opacity: 0.5; }
.folder-path {
  padding: 6px 10px;
  font-size: 11px;
  color: var(--color-text-muted);
  font-family: monospace;
  border-bottom: 1px solid var(--color-border);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bulk-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-bottom: 1px solid var(--color-border);
}
.action-link {
  background: none;
  border: none;
  color: var(--color-accent);
  font-size: 12px;
  cursor: pointer;
  padding: 2px 4px;
  font-family: inherit;
}
.selected-count { margin-left: auto; font-size: 12px; color: var(--color-text-muted); }
.search-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-bottom: 1px solid var(--color-border);
}
.search-icon { color: var(--color-text-muted); flex-shrink: 0; }
.search-input {
  flex: 1;
  background: none;
  border: none;
  color: var(--color-text);
  font-size: 12px;
  font-family: inherit;
  outline: none;
}
.file-list {
  flex: 1;
  overflow-y: auto;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 6px;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.12s;
  border: 1px solid transparent;
}
.file-item:hover { background: var(--color-bg-hover); }
.file-item.selected { background: var(--color-bg-panel); border-color: var(--color-accent); }
.file-thumb-wrap { position: relative; flex-shrink: 0; }
.file-thumb { width: 36px; height: 36px; object-fit: cover; border-radius: 4px; display: block; }
.file-checkbox {
  position: absolute;
  top: -3px;
  right: -3px;
  width: 14px;
  height: 14px;
  background: var(--color-accent);
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transition: opacity 0.15s;
}
.file-item.selected .file-checkbox { opacity: 1; }
.file-name {
  flex: 1;
  font-size: 12px;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.explorer-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--color-text-muted);
  font-size: 13px;
}
.empty-icon { opacity: 0.3; }
</style>
