<template>
  <aside class="inspector">

    <!-- Промпт -->
    <section class="inspector-section">
      <div class="section-title">Промпт</div>

      <!-- Выбор сохранённого -->
      <div class="prompt-select-row">
        <select class="select-field" :value="prompts.selected?.id ?? ''" @change="onSelectPrompt">
          <option value="">— новый промпт —</option>
          <option v-for="p in prompts.list" :key="p.id" :value="p.id">{{ p.title }}</option>
        </select>
        <button class="icon-btn danger" :disabled="!prompts.selected" @click="deletePrompt" title="Удалить">
          <Trash2 :size="13" />
        </button>
      </div>

      <!-- Текст промпта -->
      <textarea
        v-model="prompts.draftText"
        class="prompt-textarea"
        rows="6"
        placeholder="Текст промпта для ретуши..."
      />

      <!-- Сохранение -->
      <div class="prompt-actions">
        <input
          v-model="prompts.draftTitle"
          class="input-field"
          placeholder="Название промпта"
        />
        <button class="btn-sm" :disabled="!canSaveNew" @click="saveAsNew" title="Сохранить как новый">
          <Plus :size="12" /> Новый
        </button>
        <button class="btn-sm" :disabled="!canUpdate" @click="updatePrompt" title="Обновить выбранный">
          <Save :size="12" /> Сохранить
        </button>
      </div>
    </section>

    <!-- Модель -->
    <section class="inspector-section">
      <div class="section-title">Модель</div>
      <select v-model="selectedModelId" class="select-field" @change="onModelChange">
        <option v-for="m in retouchModels" :key="m.id" :value="m.id">{{ m.name }}</option>
      </select>

      <div class="settings-grid" style="margin-top: 8px;">
        <div class="setting-item">
          <label class="field-label">Размер</label>
          <select v-model="selectedSize" class="select-field">
            <option v-for="s in currentModel?.sizes" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
        <div class="setting-item">
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
      </div>
    </section>

    <!-- Экспорт -->
    <section class="inspector-section">
      <div class="section-title">Экспорт</div>
      <div class="settings-grid">
        <div class="setting-item">
          <label class="field-label">Формат</label>
          <div class="toggle-group">
            <button v-for="f in formats" :key="f" class="toggle-btn" :class="{ active: outputFormat === f }" @click="outputFormat = f">{{ f.toUpperCase() }}</button>
          </div>
        </div>
        <div class="setting-item">
          <label class="field-label">Пресет</label>
          <div class="toggle-group">
            <button v-for="p in presets" :key="p.value" class="toggle-btn" :class="{ active: retouchPreset === p.value }" @click="retouchPreset = p.value">{{ p.label }}</button>
          </div>
        </div>
        <div class="setting-item">
          <label class="field-label">Макс. разрешение</label>
          <select v-model="maxDimension" class="select-field">
            <option :value="0">Оригинал</option>
            <option :value="1024">1024px</option>
            <option :value="1536">1536px</option>
            <option :value="2048">2048px</option>
          </select>
        </div>
        <div class="setting-item">
          <label class="field-label">Сохранение</label>
          <div class="toggle-group">
            <button class="toggle-btn" :class="{ active: outputMode === 'subfolder' }" @click="outputMode = 'subfolder'">/processed</button>
            <button class="toggle-btn" :class="{ active: outputMode === 'suffix' }" @click="outputMode = 'suffix'">_retouched</button>
          </div>
        </div>
      </div>
    </section>

    <!-- Прогресс -->
    <section v-if="batch.currentJob" class="inspector-section">
      <div class="progress-info">
        <span>{{ batch.currentJob.completed }} / {{ batch.currentJob.total }}</span>
        <span class="status-badge" :class="'status-' + batch.currentJob.status">{{ batch.currentJob.status }}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progressPct + '%' }"></div>
      </div>
      <div v-if="batch.currentJob.failed" class="failed-count">Ошибок: {{ batch.currentJob.failed }}</div>
    </section>

    <!-- Действие -->
    <div class="inspector-footer">
      <button v-if="batch.isRunning" class="btn-cancel" @click="batch.cancelBatch()">
        <Square :size="13" /> Остановить
      </button>
      <button v-else class="btn-start" :disabled="!canStart" @click="startBatch">
        <Play :size="14" /> Старт ({{ files.selected.size }})
      </button>
    </div>

  </aside>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Play, Square, Plus, Save, Trash2 } from 'lucide-vue-next';
import { usePromptsStore } from '@/stores/prompts';
import { useFilesStore } from '@/stores/files';
import { useBatchStore } from '@/stores/batch';
import { api, type ModelConfig } from '@/api';

const emit = defineEmits<{ (e: 'started'): void }>();

const prompts = usePromptsStore();
const files   = useFilesStore();
const batch   = useBatchStore();

const retouchModels   = ref<ModelConfig[]>([]);
const selectedModelId = ref('');
const selectedSize    = ref('');
const selectedQuality = ref('');
const outputFormat    = ref<'webp' | 'jpeg' | 'png'>('webp');
const outputMode      = ref<'subfolder' | 'suffix'>('subfolder');
const maxDimension    = ref(1536);
const retouchPreset   = ref<'soft' | 'medium' | 'strong'>('medium');

const formats = ['webp', 'jpeg', 'png'] as const;
const presets = [
  { value: 'soft',   label: 'Мягкая' },
  { value: 'medium', label: 'Средняя' },
  { value: 'strong', label: 'Сильная' },
];

const currentModel = computed(() =>
  retouchModels.value.find(m => m.id === selectedModelId.value)
);

const canStart   = computed(() => files.selected.size > 0 && !!prompts.draftText.trim());
const canSaveNew = computed(() => !!prompts.draftText.trim() && !!prompts.draftTitle.trim());
const canUpdate  = computed(() => !!prompts.selected && !!prompts.draftText.trim());

const progressPct = computed(() => {
  const j = batch.currentJob;
  if (!j || !j.total) return 0;
  return Math.round((j.completed / j.total) * 100);
});

onMounted(async () => {
  await prompts.fetchList('retouch');
  if (prompts.list.length) prompts.selectById(prompts.list[0].id);

  const config = await api.getConfig();
  const provider = config.providers.find(p => p.id === config.active_provider);
  if (provider) {
    retouchModels.value = provider.models.filter(m => m.modes.includes('retouch'));
    if (retouchModels.value.length) {
      const first = retouchModels.value[0];
      selectedModelId.value = first.id;
      selectedSize.value    = first.sizes[0] ?? '1024x1024';
      selectedQuality.value = first.quality[0] ?? 'standard';
    }
  }
});

function onSelectPrompt(e: Event) {
  const id = (e.target as HTMLSelectElement).value;
  if (id) prompts.selectById(id);
  else prompts.clearDraft();
}

function onModelChange() {
  const m = currentModel.value;
  if (!m) return;
  if (!m.sizes.includes(selectedSize.value))    selectedSize.value    = m.sizes[0]    ?? '';
  if (!m.quality.includes(selectedQuality.value)) selectedQuality.value = m.quality[0] ?? '';
}

async function saveAsNew()     { await prompts.saveAsNew('retouch'); }
async function updatePrompt()  { await prompts.updateSelected(); }
async function deletePrompt()  { await prompts.deleteSelected(); }

async function startBatch() {
  if (!canStart.value) return;
  await batch.startBatch({
    source_files:   Array.from(files.selected),
    prompt_id:      prompts.selected?.id ?? '',
    model_id:       selectedModelId.value,
    size:           selectedSize.value,
    quality:        selectedQuality.value,
    retouch_preset: retouchPreset.value,
    output_mode:    outputMode.value,
    output_format:  outputFormat.value,
    max_dimension:  maxDimension.value,
  });
  emit('started');
}
</script>

<style scoped>
.inspector { width: 380px; min-width: 380px; background: var(--color-bg-surface); border-left: 1px solid var(--color-border); display: flex; flex-direction: column; overflow: hidden; overflow-y: auto; }
.inspector-section { padding: 12px 14px; border-bottom: 1px solid var(--color-border); }
.section-title { font-size: 11px; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
.select-field { width: 100%; background: var(--color-bg-panel); border: 1px solid var(--color-border); color: var(--color-text); border-radius: 6px; padding: 7px 10px; font-size: 13px; font-family: inherit; outline: none; }
.input-field { flex: 1; background: var(--color-bg-panel); border: 1px solid var(--color-border); color: var(--color-text); border-radius: 6px; padding: 6px 10px; font-size: 12px; font-family: inherit; outline: none; min-width: 0; }
.prompt-select-row { display: flex; gap: 6px; align-items: center; margin-bottom: 8px; }
.prompt-select-row .select-field { flex: 1; }
.prompt-textarea { width: 100%; background: var(--color-bg-panel); border: 1px solid var(--color-border); color: var(--color-text); border-radius: 6px; padding: 8px 10px; font-size: 13px; font-family: inherit; resize: vertical; outline: none; box-sizing: border-box; }
.prompt-actions { display: flex; gap: 6px; margin-top: 8px; align-items: center; }
.btn-sm { display: flex; align-items: center; gap: 4px; padding: 5px 10px; background: var(--color-bg-panel); border: 1px solid var(--color-border); color: var(--color-text); border-radius: 5px; font-size: 12px; font-family: inherit; cursor: pointer; white-space: nowrap; transition: background 0.15s; }
.btn-sm:hover:not(:disabled) { background: var(--color-bg-hover); }
.btn-sm:disabled { opacity: 0.4; cursor: not-allowed; }
.icon-btn { background: none; border: 1px solid var(--color-border); border-radius: 5px; padding: 5px 7px; cursor: pointer; display: flex; align-items: center; color: var(--color-text-muted); transition: all 0.15s; flex-shrink: 0; }
.icon-btn:hover:not(:disabled) { background: var(--color-bg-hover); color: var(--color-text); }
.icon-btn.danger:hover:not(:disabled) { color: var(--color-danger); border-color: var(--color-danger); }
.icon-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.settings-grid { display: flex; flex-direction: column; gap: 10px; }
.setting-item { display: flex; flex-direction: column; gap: 4px; }
.field-label { font-size: 12px; color: var(--color-text-muted); }
.toggle-group { display: flex; gap: 4px; }
.toggle-btn { flex: 1; padding: 6px 4px; background: var(--color-bg-panel); border: 1px solid var(--color-border); color: var(--color-text-muted); border-radius: 5px; font-size: 12px; font-family: inherit; cursor: pointer; transition: all 0.15s; text-align: center; }
.toggle-btn:hover { background: var(--color-bg-hover); color: var(--color-text); }
.toggle-btn.active { background: var(--color-accent); border-color: var(--color-accent); color: white; }
.progress-info { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; font-size: 12px; }
.status-badge { padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; background: var(--color-bg-panel); }
.status-running { background: rgba(108,99,255,0.2); color: var(--color-accent); }
.status-done { background: rgba(62,207,142,0.15); color: var(--color-success); }
.status-cancelled { background: var(--color-bg-hover); color: var(--color-text-muted); }
.progress-bar { height: 4px; background: var(--color-bg-panel); border-radius: 2px; overflow: hidden; }
.progress-fill { height: 100%; background: var(--color-accent); border-radius: 2px; transition: width 0.3s; }
.failed-count { margin-top: 5px; font-size: 12px; color: var(--color-danger); }
.inspector-footer { padding: 12px 14px; border-top: 1px solid var(--color-border); margin-top: auto; }
.btn-start { width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 11px; background: var(--color-accent); color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 700; font-family: inherit; cursor: pointer; transition: background 0.15s; }
.btn-start:hover:not(:disabled) { background: var(--color-accent-hover); }
.btn-start:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-cancel { width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 11px; background: none; color: var(--color-danger); border: 1px solid var(--color-danger); border-radius: 8px; font-size: 14px; font-weight: 600; font-family: inherit; cursor: pointer; transition: background 0.15s; }
.btn-cancel:hover { background: rgba(240,82,82,0.1); }
</style>
