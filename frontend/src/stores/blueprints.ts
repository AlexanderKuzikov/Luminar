import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api, type BlueprintMeta } from '@/api';

export const useBlueprintsStore = defineStore('blueprints', () => {
  const list = ref<BlueprintMeta[]>([]);
  const activeId = ref<string | null>(null);
  const activeContent = ref<string>('');

  async function fetchList() {
    list.value = await api.listBlueprints();
    if (list.value.length && !activeId.value) {
      await select(list.value[0].id);
    }
  }

  async function select(id: string) {
    activeId.value = id;
    const data = await api.getBlueprint(id);
    activeContent.value = JSON.stringify(data, null, 2);
  }

  async function save() {
    if (!activeId.value) return;
    const parsed = JSON.parse(activeContent.value);
    await api.saveBlueprint(activeId.value, parsed);
  }

  return { list, activeId, activeContent, fetchList, select, save };
});
