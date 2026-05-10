<template>
  <aside class="inspector">
    <!-- Blueprint -->
    <section class="inspector-section">
      <div class="section-title">Blueprint</div>
      <select v-model="selectedBlueprintId" class="select-field" @change="onBlueprintChange">
        <option v-if="!blueprints.list.length" value="">— нет blueprints —</option>
        <option v-for="bp in blueprints.list" :key="bp.id" :value="bp.id">{{ bp.title }}</option>
      </select>
    </section>

    <!-- Monaco Editor для промпта -->
    <section class="inspector-section editor-section">
      <div class="section-title">Промпт (скомпилированный)</div>
      <MonacoEditor
        v-model="compiledPrompt"
        language="json"
        class="inspector-monaco"
      />
    </section>

    <!-- Export Settings -->
    <section class="inspector-section">
      <div class="section-title">Экспорт</div>
      <div class="settings-grid">
        <div class="setting-item">
          <label class="field-label">Формат</label>
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

        <div class="setting-item">
          <label class="field-label">Пресет ретуши</label>
          <div class="toggle-group">
            <button
              v-for="p in presets"
              :key="p.value"
              class="toggle-btn"
              :class="{ active: retouchPreset === p.value }"
              @click="retouchPreset = p.value"
            >{{ p.label }}</button>
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

    <!-- Progress -->
    <section v-if="batch.currentJob" class="inspector-section">
      <div class="progress-info">
        <span>{{ batch.currentJob.completed }} / {{ batch.currentJob.total }}</span>
        <span class="status-badge" :class="'status-' + batch.currentJob.status">{{ batch.currentJob.status }}</span>
      </div>
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: progressPct + '%' }"
        ></div>
      </div>
      <div v-if="batch.currentJob.failed" class="failed-count">
        Ошибок: {{ batch.currentJob.failed }}
      </div>
    </section>

    <!-- Action -->
    <div class="inspector-footer">
      <button
        v-if="batch.isRunning"
        class="btn-cancel"
        @click="batch.cancelBatch()"
      >
        <Square :size="13" />
        Остановить
      </button>
      <button
        v-else
        class="btn-start"
        :disabled="!canStart"
        @click="startBatch"
      >
        <Play :size="14" />
        Старт ({{ files.selected.size }})
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { Play, Square } from 'lucide-vue-next';
import { useBlueprintsStore } from '@/stores/blueprints';
import { useFilesStore } from '@/stores/files';
import { useBatchStore } from '@/stores/batch';
import MonacoEditor from '@/components/MonacoEditor.vue';
import { api } from '@/api';

const emit = defineEmits<{ (e: 'started'): void }>();

const blueprints = useBlueprintsStore();
const files = useFilesStore();
const batch = useBatchStore();

const selectedBlueprintId = ref('');
const compiledPrompt = ref('');
const outputFormat = ref<'webp' | 'jpeg' | 'png'>('webp');
const outputMode = ref<'subfolder' | 'suffix'>('subfolder');
const maxDimension = ref(1536);
const retouchPreset = ref<'soft' | 'medium' | 'strong'>('medium');

const formats = ['webp', 'jpeg', 'png'] as const;
const presets = [
  { value: 'soft',   label: 'Мягкая' },
  { value: 'medium', label: 'Средняя' },
  { value: 'strong', label: 'Сильная' },
];

const canStart = computed(() => files.selected.size > 0 && !!selectedBlueprintId.value);

const progressPct = computed(() => {
  const j = batch.currentJob;
  if (!j || !j.total) return 0;
  return Math.round((j.completed / j.total) * 100);
});

onMounted(async () => {
  await blueprints.fetchList();
  if (blueprints.list.length) {
    selectedBlueprintId.value = blueprints.list[0].id;
    await loadCompiledPrompt();
  }
});

async function onBlueprintChange() {
  await blueprints.select(selectedBlueprintId.value);
  compiledPrompt.value = blueprints.activeContent;
}

async function loadCompiledPrompt() {
  await blueprints.select(selectedBlueprintId.value);
  compiledPrompt.value = blueprints.activeContent;
}

async function startBatch() {
  if (!canStart.value) return;
  await batch.startBatch({
    source_files: Array.from(files.selected),
    blueprint_id: selectedBlueprintId.value,
    retouch_preset: retouchPreset.value,
    output_mode: outputMode.value,
    output_format: outputFormat.value,
    max_dimension: maxDimension.value,
  });
  emit('started');
}
</script>

<style scoped>
.inspector {
  width: 380px;
  min-width: 380px;
  background: var(--color-bg-surface);
  border-left: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.inspector-section {
  padding: 12px 14px;
  border-bottom: 1px solid var(--color-border);
}
.editor-section { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
.inspector-monaco { flex: 1; overflow: hidden; min-height: 140px; }
.section-title { font-size: 11px; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
.select-field { width: 100%; background: var(--color-bg-panel); border: 1px solid var(--color-border); color: var(--color-text); border-radius: 6px; padding: 7px 10px; font-size: 13px; font-family: inherit; outline: none; }
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
.btn-start {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 11px;
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-start:hover:not(:disabled) { background: var(--color-accent-hover); }
.btn-start:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-cancel {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 11px;
  background: none;
  color: var(--color-danger);
  border: 1px solid var(--color-danger);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-cancel:hover { background: rgba(240,82,82,0.1); }
</style>
