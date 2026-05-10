<template>
  <div class="generate-layout">
    <!-- Левая: История -->
    <aside class="gen-history">
      <div class="panel-header">История</div>
      <div class="history-list">
        <div
          v-for="entry in genHistory"
          :key="entry.id"
          class="history-item"
          :class="{ active: selected?.id === entry.id }"
          @click="selected = entry"
        >
          <img :src="api.imageUrl(entry.result_file)" class="history-thumb" />
          <span class="history-name">{{ formatDate(entry.created_at) }}</span>
        </div>
      </div>
    </aside>

    <!-- Центр: Результат -->
    <div class="gen-preview">
      <div v-if="selected" class="preview-wrap">
        <img :src="api.imageUrl(selected.result_file)" class="preview-img" />
        <div class="preview-prompt">{{ selected.prompt_snapshot }}</div>
      </div>
      <div v-else class="preview-empty">Нет сгенерированных изображений</div>
    </div>

    <!-- Правая: Настройки -->
    <aside class="gen-inspector">
      <div class="panel-header">Генерация</div>
      <div class="inspector-body">
        <label class="field-label">Blueprint</label>
        <select v-model="selectedBlueprintId" class="select-field">
          <option v-for="bp in blueprints.list" :key="bp.id" :value="bp.id">{{ bp.title }}</option>
        </select>

        <label class="field-label">Промпт (переопределить)</label>
        <textarea v-model="promptOverride" class="textarea-field" rows="6" placeholder="Оставьте пустым чтобы использовать Blueprint"></textarea>
      </div>

      <div class="inspector-footer">
        <button class="btn-primary" :disabled="isRunning" @click="runGenerate">
          <Loader2 v-if="isRunning" :size="14" class="spin" />
          <ImagePlus v-else :size="14" />
          Сгенерировать
        </button>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Loader2, ImagePlus } from 'lucide-vue-next';
import { useBlueprintsStore } from '@/stores/blueprints';
import { api, type RegistryEntry } from '@/api';

const blueprints = useBlueprintsStore();
const selectedBlueprintId = ref<string>('');
const promptOverride = ref('');
const isRunning = ref(false);
const genHistory = ref<RegistryEntry[]>([]);
const selected = ref<RegistryEntry | null>(null);

onMounted(async () => {
  await blueprints.fetchList();
  if (blueprints.list.length) selectedBlueprintId.value = blueprints.list[0].id;
  const all = await api.getRegistry();
  genHistory.value = all.filter(e => e.type === 'generate').reverse();
});

async function runGenerate() {
  if (!selectedBlueprintId.value) return;
  isRunning.value = true;
  try {
    const { entry } = await api.generate({
      blueprint_id: selectedBlueprintId.value,
      prompt_override: promptOverride.value || undefined,
    });
    genHistory.value.unshift(entry as RegistryEntry);
    selected.value = entry as RegistryEntry;
  } finally {
    isRunning.value = false;
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
</script>

<style scoped>
.generate-layout { display: flex; width: 100%; height: 100%; overflow: hidden; }
.gen-history { width: 260px; min-width: 260px; background: var(--color-bg-surface); border-right: 1px solid var(--color-border); display: flex; flex-direction: column; overflow: hidden; }
.gen-preview { flex: 1; display: flex; align-items: center; justify-content: center; background: var(--color-bg-base); overflow: hidden; }
.gen-inspector { width: 380px; min-width: 380px; background: var(--color-bg-surface); border-left: 1px solid var(--color-border); display: flex; flex-direction: column; }
.panel-header { padding: 12px 14px; font-size: 12px; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--color-border); }
.history-list { flex: 1; overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 4px; }
.history-item { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 6px; cursor: pointer; transition: background 0.15s; }
.history-item:hover { background: var(--color-bg-hover); }
.history-item.active { background: var(--color-bg-panel); }
.history-thumb { width: 36px; height: 36px; object-fit: cover; border-radius: 4px; }
.history-name { font-size: 12px; color: var(--color-text-muted); }
.preview-wrap { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 24px; max-height: 100%; }
.preview-img { max-width: 100%; max-height: calc(100vh - 200px); border-radius: 8px; object-fit: contain; }
.preview-prompt { font-size: 12px; color: var(--color-text-muted); text-align: center; max-width: 600px; }
.preview-empty { color: var(--color-text-muted); font-size: 14px; }
.inspector-body { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 12px; }
.inspector-footer { padding: 12px 14px; border-top: 1px solid var(--color-border); }
.field-label { font-size: 12px; color: var(--color-text-muted); margin-bottom: 4px; display: block; }
.select-field { width: 100%; background: var(--color-bg-panel); border: 1px solid var(--color-border); color: var(--color-text); border-radius: 6px; padding: 7px 10px; font-size: 13px; font-family: inherit; outline: none; }
.textarea-field { width: 100%; background: var(--color-bg-panel); border: 1px solid var(--color-border); color: var(--color-text); border-radius: 6px; padding: 8px 10px; font-size: 13px; font-family: inherit; resize: vertical; outline: none; }
.btn-primary { width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px; background: var(--color-accent); color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; font-family: inherit; cursor: pointer; transition: background 0.15s; }
.btn-primary:hover:not(:disabled) { background: var(--color-accent-hover); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
