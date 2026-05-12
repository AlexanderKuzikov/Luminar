<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <span>Настройки API</span>
        <button class="icon-btn" @click="$emit('close')"><X :size="16" /></button>
      </div>

      <div class="modal-body">
        <!-- Активный провайдер -->
        <div class="field-group">
          <label class="field-label">Активный провайдер</label>
          <select v-model="config.active_provider" class="select-field">
            <option v-for="p in config.providers" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </div>

        <!-- Порт -->
        <div class="field-group">
          <label class="field-label">Порт (дефолт 3333)</label>
          <input v-model.number="config.port" type="number" class="input-field" min="1024" max="65535" />
        </div>

        <!-- Провайдеры -->
        <div v-for="(provider, idx) in config.providers" :key="provider.id" class="provider-block">
          <div class="provider-title">
            {{ provider.name }}
            <span class="provider-id">{{ provider.id }}</span>
          </div>

          <div class="field-group">
            <label class="field-label">Base URL</label>
            <input v-model="config.providers[idx].baseURL" type="text" class="input-field" />
          </div>

          <div class="field-group">
            <label class="field-label">Стратегия ретуши</label>
            <select v-model="config.providers[idx].retouch_strategy" class="select-field">
              <option value="edit">edit (/v1/images/edits)</option>
              <option value="generate">generate (/v1/images/generations)</option>
            </select>
          </div>

          <!-- Ключи -->
          <div class="field-group">
            <label class="field-label">Активный ключ</label>
            <select v-model="config.providers[idx].active_key" class="select-field">
              <option v-for="k in provider.keys" :key="k.id" :value="k.id">
                {{ k.label }}
                <template v-if="k.configured"> ✓</template>
                <template v-else> ⚠️ не задан</template>
              </option>
            </select>
          </div>

          <!-- Список ключей -->
          <div class="keys-list">
            <div v-for="k in provider.keys" :key="k.id" class="key-row">
              <span class="key-label">{{ k.label }}</span>
              <code class="key-env">{{ k.envVar }}</code>
              <span class="key-status" :class="k.configured ? 'ok' : 'missing'">
                {{ k.configured ? '✓ есть' : '⚠️ .env' }}
              </span>
            </div>
          </div>

          <p class="hint">Для смены значений ключей — редактируйте <code>.env</code> в корне проекта</p>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-ghost" @click="$emit('close')">Отмена</button>
        <button class="btn-primary" @click="save">
          <Save :size="13" /> Сохранить
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { X, Save } from 'lucide-vue-next';
import { api, type AppConfig } from '@/api';

const emit = defineEmits<{ (e: 'close'): void }>();

const config = ref<AppConfig>({
  port: 3333,
  active_provider: '',
  ui: { theme: 'dark', default_output: 'subfolder' },
  providers: [],
});

onMounted(async () => {
  config.value = await api.getConfig();
});

async function save() {
  await api.saveConfig(config.value);
  emit('close');
}
</script>

<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 1000; display: flex; align-items: center; justify-content: center; }
.modal { background: var(--color-bg-surface); border: 1px solid var(--color-border); border-radius: 10px; width: 520px; max-width: 95vw; max-height: 85vh; display: flex; flex-direction: column; }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid var(--color-border); font-weight: 600; }
.modal-body { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 14px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 16px; border-top: 1px solid var(--color-border); }
.field-group { display: flex; flex-direction: column; gap: 4px; }
.field-label { font-size: 12px; color: var(--color-text-muted); }
.input-field { background: var(--color-bg-panel); border: 1px solid var(--color-border); color: var(--color-text); border-radius: 6px; padding: 7px 10px; font-size: 13px; font-family: inherit; outline: none; width: 100%; }
.input-field:focus { border-color: var(--color-accent); }
.select-field { width: 100%; background: var(--color-bg-panel); border: 1px solid var(--color-border); color: var(--color-text); border-radius: 6px; padding: 7px 10px; font-size: 13px; font-family: inherit; outline: none; }
.provider-block { background: var(--color-bg-panel); border: 1px solid var(--color-border); border-radius: 8px; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
.provider-title { font-size: 13px; font-weight: 600; color: var(--color-text); display: flex; align-items: center; gap: 8px; }
.provider-id { font-size: 11px; color: var(--color-text-muted); font-family: monospace; }
.keys-list { display: flex; flex-direction: column; gap: 6px; }
.key-row { display: flex; align-items: center; gap: 8px; padding: 6px 8px; background: var(--color-bg-surface); border-radius: 5px; font-size: 12px; }
.key-label { flex: 0 0 80px; color: var(--color-text); }
.key-env { flex: 1; color: var(--color-accent); font-size: 11px; background: none; }
.key-status { flex: 0 0 70px; text-align: right; }
.key-status.ok { color: var(--color-success); }
.key-status.missing { color: var(--color-warning); }
.hint { font-size: 11px; color: var(--color-text-muted); margin: 0; }
.hint code { color: var(--color-accent); }
.btn-ghost { display: inline-flex; align-items: center; gap: 5px; padding: 7px 12px; background: none; border: 1px solid var(--color-border); color: var(--color-text); border-radius: 6px; font-size: 13px; font-family: inherit; cursor: pointer; transition: background 0.15s; }
.btn-ghost:hover { background: var(--color-bg-hover); }
.btn-primary { display: inline-flex; align-items: center; gap: 5px; padding: 7px 14px; background: var(--color-accent); color: white; border: none; border-radius: 6px; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; transition: background 0.15s; }
.btn-primary:hover { background: var(--color-accent-hover); }
.icon-btn { background: none; border: none; color: var(--color-text-muted); cursor: pointer; padding: 4px; border-radius: 4px; display: flex; align-items: center; }
.icon-btn:hover { color: var(--color-text); }
</style>
