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
          <div class="history-info">
            <span class="history-date">{{ formatDate(entry.created_at) }}</span>
            <span class="history-model">{{ entry.model }}</span>
          </div>
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

        <!-- Промпт -->
        <div class="section">
          <label class="field-label">Промпт</label>
          <div class="prompt-select-row">
            <select class="select-field" :value="prompts.selected?.id ?? ''" @change="onSelectPrompt">
              <option value="">— новый промпт —</option>
              <option v-for="p in prompts.list" :key="p.id" :value="p.id">{{ p.title }}</option>
            </select>
            <button class="icon-btn danger" :disabled="!prompts.selected" @click="deletePrompt" title="Удалить">
              <Trash2 :size="13" />
            </button>
          </div>
          <textarea
            v-model="prompts.draftText"
            class="textarea-field"
            rows="6"
            placeholder="Описание желаемого изображения..."
          />
          <div class="prompt-actions">
            <input v-model="prompts.draftTitle" class="input-field" placeholder="Название" />
            <button class="btn-sm" :disabled="!canSaveNew" @click="saveAsNew">
              <Plus :size="12" /> Новый
            </button>
            <button class="btn-sm" :disabled="!canUpdate" @click="updatePrompt">
              <Save :size="12" /> Обновить
            </button>
          </div>
        </div>

        <!-- Модель -->
        <div class="section">
          <label class="field-label">Модель</label>
          <select v-model="selectedModelId" class="select-field" @change="onModelChange">
            <option v-for="m in generateModels" :key="m.id" :value="m.id">{{ m.name }}</option>
          </select>
        </div>

        <!-- Параметры -->
        <div class="section">
          <label class="field-label">Размер</label>
          <select v-model="selectedSize" class="select-field">
            <option v-for="s in currentModel?.sizes" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>

        <div class="section">
          <label class="field-label">Quality</label>
          <div class="toggle-group">
            <button
              v-for="q in currentModel?.quality"
              :key="q"
              class="toggle-btn"
              :class="{ active: selectedQuality === q }"
              @click="selectedQuality = q"
            >{{ q }}</button>
          </div>
        </div>

        <div class="section">
          <label class="field-label">Формат сохранения</label>
          <div class="toggle-group">
            <button
              v-for="f in formats"
              :key="f"
              class="toggle-btn"
              :class="{ active: outputFormat === f }"
              @click="outputFormat = f"
            >{{ f.toUpperCase() }}</button>
          </div>
        </div>

      </div>

      <div class="inspector-footer">
        <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
        <button class="btn-primary" :disabled="isRunning || !canGenerate" @click="runGenerate">
          <Loader2 v-if="isRunning" :size="14" class="spin" />
          <ImagePlus v-else :size="14" />
          Сгенерировать
        </button>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Loader2, ImagePlus, Plus, Save, Trash2 } from 'lucide-vue-next';
import { usePromptsStore } from '@/stores/prompts';
import { api, type RegistryEntry, type ModelConfig } from '@/api';

const prompts = usePromptsStore();

const isRunning      = ref(false);
const errorMsg       = ref('');
const genHistory     = ref<RegistryEntry[]>([]);
const selected       = ref<RegistryEntry | null>(null);
const generateModels = ref<ModelConfig[]>([]);
const selectedModelId = ref('');
const selectedSize    = ref('');
const selectedQuality = ref('');
const outputFormat    = ref<'webp' | 'jpeg' | 'png'>('webp');

const formats = ['webp', 'jpeg', 'png'] as const;

const currentModel = computed(() =>
  generateModels.value.find(m => m.id === selectedModelId.value)
);

const canGenerate = computed(() => !!prompts.draftText.trim() && !!selectedModelId.value);
const canSaveNew  = computed(() => !!prompts.draftText.trim() && !!prompts.draftTitle.trim());
const canUpdate   = computed(() => !!prompts.selected && !!prompts.draftText.trim());

onMounted(async () => {
  await prompts.fetchList('generate');
  if (prompts.list.length) prompts.selectById(prompts.list[0].id);

  const config = await api.getConfig();
  const provider = config.providers.find(p => p.id === config.active_provider);
  if (provider) {
    generateModels.value = provider.models.filter(m => m.modes.includes('generate'));
    if (generateModels.value.length) {
      const first = generateModels.value[0];
      selectedModelId.value = first.id;
      selectedSize.value    = first.sizes[0]    ?? '1024x1024';
      selectedQuality.value = first.quality[0]  ?? 'standard';
    }
  }

  const all = await api.getRegistry();
  genHistory.value = all.filter(e => e.type === 'generate').reverse();
});

function onSelectPrompt(e: Event) {
  const id = (e.target as HTMLSelectElement).value;
  if (id) prompts.selectById(id);
  else prompts.clearDraft();
}

function onModelChange() {
  const m = currentModel.value;
  if (!m) return;
  if (!m.sizes.includes(selectedSize.value))       selectedSize.value    = m.sizes[0]    ?? '';
  if (!m.quality.includes(selectedQuality.value))  selectedQuality.value = m.quality[0]  ?? '';
}

async function saveAsNew()    { await prompts.saveAsNew('generate'); }
async function updatePrompt() { await prompts.updateSelected(); }
async function deletePrompt() { await prompts.deleteSelected(); }

async function runGenerate() {
  if (!canGenerate.value) return;
  isRunning.value = true;
  errorMsg.value  = '';
  try {
    const { entry } = await api.generate({
      prompt_id:     prompts.selected?.id,
      prompt_text:   prompts.selected ? undefined : prompts.draftText,
      model_id:      selectedModelId.value,
      size:          selectedSize.value,
      quality:       selectedQuality.value,
      output_format: outputFormat.value,
    });
    genHistory.value.unshift(entry as RegistryEntry);
    selected.value = entry as RegistryEntry;
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : String(err);
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
.gen-history { width: 240px; min-width: 240px; background: var(--color-bg-surface); border-right: 1px solid var(--color-border); display: flex; flex-direction: column; overflow: hidden; }
.gen-preview { flex: 1; display: flex; align-items: center; justify-content: center; background: var(--color-bg-base); overflow: hidden; }
.gen-inspector { width: 340px; min-width: 340px; background: var(--color-bg-surface); border-left: 1px solid var(--color-border); display: flex; flex-direction: column; }
.panel-header { padding: 12px 14px; font-size: 12px; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--color-border); }
.history-list { flex: 1; overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 4px; }
.history-item { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 6px; cursor: pointer; transition: background 0.15s; }
.history-item:hover { background: var(--color-bg-hover); }
.history-item.active { background: var(--color-bg-panel); }
.history-thumb { width: 36px; height: 36px; object-fit: cover; border-radius: 4px; flex-shrink: 0; }
.history-info { display: flex; flex-direction: column; gap: 1px; overflow: hidden; }
.history-date { font-size: 12px; color: var(--color-text-muted); }
.history-model { font-size: 11px; color: var(--color-text-muted); opacity: 0.6; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.preview-wrap { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 24px; max-height: 100%; overflow: auto; }
.preview-img { max-width: 100%; max-height: calc(100vh - 200px); border-radius: 8px; object-fit: contain; }
.preview-prompt { font-size: 12px; color: var(--color-text-muted); text-align: center; max-width: 600px; }
.preview-empty { color: var(--color-text-muted); font-size: 14px; }
.inspector-body { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 14px; }
.inspector-footer { padding: 12px 14px; border-top: 1px solid var(--color-border); display: flex; flex-direction: column; gap: 8px; }
.section { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: 12px; color: var(--color-text-muted); }
.select-field { width: 100%; background: var(--color-bg-panel); border: 1px solid var(--color-border); color: var(--color-text); border-radius: 6px; padding: 7px 10px; font-size: 13px; font-family: inherit; outline: none; }
.textarea-field { width: 100%; background: var(--color-bg-panel); border: 1px solid var(--color-border); color: var(--color-text); border-radius: 6px; padding: 8px 10px; font-size: 13px; font-family: inherit; resize: vertical; outline: none; box-sizing: border-box; }
.input-field { flex: 1; background: var(--color-bg-panel); border: 1px solid var(--color-border); color: var(--color-text); border-radius: 6px; padding: 6px 10px; font-size: 12px; font-family: inherit; outline: none; min-width: 0; }
.prompt-select-row { display: flex; gap: 6px; align-items: center; }
.prompt-select-row .select-field { flex: 1; }
.prompt-actions { display: flex; gap: 6px; align-items: center; }
.btn-sm { display: flex; align-items: center; gap: 4px; padding: 5px 10px; background: var(--color-bg-panel); border: 1px solid var(--color-border); color: var(--color-text); border-radius: 5px; font-size: 12px; font-family: inherit; cursor: pointer; white-space: nowrap; transition: background 0.15s; }
.btn-sm:hover:not(:disabled) { background: var(--color-bg-hover); }
.btn-sm:disabled { opacity: 0.4; cursor: not-allowed; }
.icon-btn { background: none; border: 1px solid var(--color-border); border-radius: 5px; padding: 5px 7px; cursor: pointer; display: flex; align-items: center; color: var(--color-text-muted); transition: all 0.15s; flex-shrink: 0; }
.icon-btn:hover:not(:disabled) { background: var(--color-bg-hover); color: var(--color-text); }
.icon-btn.danger:hover:not(:disabled) { color: var(--color-danger); border-color: var(--color-danger); }
.icon-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.toggle-group { display: flex; gap: 4px; }
.toggle-btn { flex: 1; padding: 6px 4px; background: var(--color-bg-panel); border: 1px solid var(--color-border); color: var(--color-text-muted); border-radius: 5px; font-size: 12px; font-family: inherit; cursor: pointer; transition: all 0.15s; text-align: center; }
.toggle-btn:hover { background: var(--color-bg-hover); color: var(--color-text); }
.toggle-btn.active { background: var(--color-accent); border-color: var(--color-accent); color: white; }
.error-msg { font-size: 12px; color: var(--color-danger); padding: 4px 0; }
.btn-primary { width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px; background: var(--color-accent); color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; font-family: inherit; cursor: pointer; transition: background 0.15s; }
.btn-primary:hover:not(:disabled) { background: var(--color-accent-hover); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
