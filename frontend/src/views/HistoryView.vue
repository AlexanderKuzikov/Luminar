<template>
  <div class="history-layout">
    <div class="history-header">
      <span>История обработки</span>
      <span class="history-count">{{ entries.length }} записей</span>
    </div>

    <!-- Сессии -->
    <div class="sessions-bar">
      <button
        v-for="s in sessions"
        :key="s.session_id"
        class="session-btn"
        :class="{ active: activeSession === s.session_id }"
        @click="activeSession = s.session_id"
      >
        {{ formatDate(s.date) }}
        <span class="session-count">{{ s.count }}</span>
        <span v-if="s.failed" class="session-failed">{{ s.failed }} ✕</span>
      </button>
    </div>

    <!-- Таблица -->
    <div class="history-table-wrap">
      <table class="history-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Тип</th>
            <th>Источник</th>
            <th>Результат</th>
            <th>Модель</th>
            <th>Статус</th>
            <th>Дата</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in filteredEntries" :key="e.id" :class="'row-' + e.status">
            <td>{{ e.id }}</td>
            <td>{{ e.type }}</td>
            <td class="cell-path" :title="e.source_file">{{ basename(e.source_file) }}</td>
            <td class="cell-path">
              <span v-if="e.result_file">
                <img :src="api.imageUrl(e.result_file)" class="inline-thumb" />
                {{ basename(e.result_file) }}
              </span>
            </td>
            <td>{{ e.model }}</td>
            <td><span :class="'badge badge-' + e.status">{{ e.status }}</span></td>
            <td>{{ formatDate(e.created_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { api, type RegistryEntry, type SessionMeta } from '@/api';

const entries = ref<RegistryEntry[]>([]);
const sessions = ref<SessionMeta[]>([]);
const activeSession = ref<string | null>(null);

const filteredEntries = computed(() =>
  activeSession.value
    ? entries.value.filter(e => e.session_id === activeSession.value)
    : entries.value
);

onMounted(async () => {
  [entries.value, sessions.value] = await Promise.all([api.getRegistry(), api.getSessions()]);
  if (sessions.value.length) activeSession.value = sessions.value[0].session_id;
});

function basename(p?: string) {
  if (!p) return '—';
  return p.split(/[\\/]/).pop() ?? p;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
</script>

<style scoped>
.history-layout { display: flex; flex-direction: column; width: 100%; height: 100%; overflow: hidden; background: var(--color-bg-base); }
.history-header { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: var(--color-bg-surface); border-bottom: 1px solid var(--color-border); font-size: 14px; font-weight: 600; }
.history-count { font-size: 12px; color: var(--color-text-muted); }
.sessions-bar { display: flex; gap: 6px; padding: 8px 12px; background: var(--color-bg-surface); border-bottom: 1px solid var(--color-border); overflow-x: auto; flex-shrink: 0; }
.session-btn { display: flex; align-items: center; gap: 5px; padding: 5px 10px; background: var(--color-bg-panel); border: 1px solid var(--color-border); color: var(--color-text-muted); border-radius: 5px; font-size: 12px; font-family: inherit; cursor: pointer; white-space: nowrap; transition: background 0.15s; }
.session-btn.active { border-color: var(--color-accent); color: var(--color-text); }
.session-count { background: var(--color-bg-hover); border-radius: 3px; padding: 1px 5px; font-size: 11px; }
.session-failed { color: var(--color-danger); font-size: 11px; }
.history-table-wrap { flex: 1; overflow: auto; padding: 0; }
.history-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.history-table th { padding: 9px 12px; text-align: left; font-size: 11px; font-weight: 600; color: var(--color-text-muted); background: var(--color-bg-surface); border-bottom: 1px solid var(--color-border); position: sticky; top: 0; }
.history-table td { padding: 8px 12px; border-bottom: 1px solid var(--color-border); color: var(--color-text); }
.row-failed td { color: var(--color-danger); opacity: 0.8; }
.row-rejected td { opacity: 0.5; }
.cell-path { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: monospace; font-size: 12px; }
.inline-thumb { width: 20px; height: 20px; object-fit: cover; border-radius: 3px; vertical-align: middle; margin-right: 4px; }
.badge { padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
.badge-success  { background: rgba(62,207,142,0.15); color: var(--color-success); }
.badge-failed   { background: rgba(240,82,82,0.15);  color: var(--color-danger); }
.badge-rejected { background: var(--color-bg-hover); color: var(--color-text-muted); }
</style>
