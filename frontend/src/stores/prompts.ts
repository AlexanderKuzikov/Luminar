import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { api, type Prompt } from '@/api';

export const usePromptsStore = defineStore('prompts', () => {
  const list = ref<Prompt[]>([]);
  const selected = ref<Prompt | null>(null);
  const draftText = ref('');
  const draftTitle = ref('');
  const loading = ref(false);

  // При смене выбранного промпта — загружаем в draft
  watch(selected, (p) => {
    draftText.value  = p?.text  ?? '';
    draftTitle.value = p?.title ?? '';
  });

  async function fetchList(type?: 'generate' | 'retouch') {
    loading.value = true;
    try {
      list.value = await api.listPrompts(type);
    } finally {
      loading.value = false;
    }
  }

  function selectById(id: string) {
    selected.value = list.value.find(p => p.id === id) ?? null;
  }

  // Сохранить как новый промпт
  async function saveAsNew(type: 'generate' | 'retouch') {
    if (!draftText.value.trim() || !draftTitle.value.trim()) return null;
    const created = await api.createPrompt({
      title: draftTitle.value.trim(),
      type,
      text: draftText.value.trim(),
    });
    list.value.push(created);
    selected.value = created;
    return created;
  }

  // Обновить текущий выбранный
  async function updateSelected() {
    if (!selected.value) return;
    const updated = await api.updatePrompt(selected.value.id, {
      title: draftTitle.value.trim(),
      text: draftText.value.trim(),
    });
    const idx = list.value.findIndex(p => p.id === updated.id);
    if (idx !== -1) list.value[idx] = updated;
    selected.value = updated;
  }

  async function deleteSelected() {
    if (!selected.value) return;
    await api.deletePrompt(selected.value.id);
    list.value = list.value.filter(p => p.id !== selected.value!.id);
    selected.value = list.value[0] ?? null;
  }

  // Сброс черновика (для unsaved inline промпта)
  function clearDraft() {
    selected.value = null;
    draftText.value  = '';
    draftTitle.value = '';
  }

  return {
    list, selected, draftText, draftTitle, loading,
    fetchList, selectById, saveAsNew, updateSelected, deleteSelected, clearDraft,
  };
});
