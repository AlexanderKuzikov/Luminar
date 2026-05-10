import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api, type FileEntry } from '@/api';

export const useFilesStore = defineStore('files', () => {
  const currentFolder = ref<string | null>(null);
  const files = ref<FileEntry[]>([]);
  const selected = ref<Set<string>>(new Set());
  const loading = ref(false);

  async function selectFolder() {
    loading.value = true;
    try {
      const result = await api.selectFolder();
      if (!result.cancelled && result.path) {
        currentFolder.value = result.path;
        files.value = result.files;
        selected.value = new Set();
      }
    } finally {
      loading.value = false;
    }
  }

  async function rescanFolder() {
    if (!currentFolder.value) return;
    loading.value = true;
    try {
      const result = await api.scanFolder(currentFolder.value);
      files.value = result.files;
    } finally {
      loading.value = false;
    }
  }

  function toggleSelect(path: string) {
    if (selected.value.has(path)) selected.value.delete(path);
    else selected.value.add(path);
    selected.value = new Set(selected.value); // trigger reactivity
  }

  function selectAll() {
    selected.value = new Set(files.value.map(f => f.path));
  }

  function selectNone() {
    selected.value = new Set();
  }

  function invertSelection() {
    selected.value = new Set(
      files.value.map(f => f.path).filter(p => !selected.value.has(p))
    );
  }

  return { currentFolder, files, selected, loading, selectFolder, rescanFolder, toggleSelect, selectAll, selectNone, invertSelection };
});
