<template>
  <div class="library-layout">
    <!-- Левая: список blueprints -->
    <aside class="lib-sidebar">
      <div class="panel-header">
        Blueprints
        <button class="icon-btn" @click="createNew" title="Создать новый">
          <Plus :size="14" />
        </button>
      </div>
      <div class="bp-list">
        <div
          v-for="bp in blueprints.list"
          :key="bp.id"
          class="bp-item"
          :class="{ active: blueprints.activeId === bp.id }"
          @click="blueprints.select(bp.id)"
        >
          <FileJson :size="14" />
          <span>{{ bp.title }}</span>
          <button class="icon-btn del-btn" @click.stop="deleteBlueprint(bp.id)">
            <Trash2 :size="12" />
          </button>
        </div>
      </div>

      <div class="panel-header" style="margin-top:8px">Snippets</div>
      <div class="bp-list">
        <div
          class="bp-item"
          :class="{ active: activeTab === 'snippets' }"
          @click="openSnippets"
        >
          <Layers :size="14" />
          snippets.json
        </div>
      </div>
    </aside>

    <!-- Правая: Monaco Editor -->
    <div class="lib-editor">
      <div class="editor-toolbar">
        <span class="editor-filename">{{ activeTab === 'snippets' ? 'snippets.json' : (blueprints.activeId ?? '') + '.json' }}</span>
        <div class="toolbar-actions">
          <button class="btn-ghost" @click="save">
            <Save :size="13" />
            Сохранить
          </button>
        </div>
      </div>
      <MonacoEditor
        v-model="editorContent"
        language="json"
        class="editor-area"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { Plus, FileJson, Trash2, Save, Layers } from 'lucide-vue-next';
import { useBlueprintsStore } from '@/stores/blueprints';
import MonacoEditor from '@/components/MonacoEditor.vue';
import { api } from '@/api';

const blueprints = useBlueprintsStore();
const editorContent = ref('');
const activeTab = ref<'blueprint' | 'snippets'>('blueprint');

onMounted(async () => {
  await blueprints.fetchList();
  editorContent.value = blueprints.activeContent;
});

watch(() => blueprints.activeContent, val => {
  if (activeTab.value === 'blueprint') editorContent.value = val;
});

async function openSnippets() {
  activeTab.value = 'snippets';
  const data = await api.getSnippets();
  editorContent.value = JSON.stringify(data, null, 2);
}

async function save() {
  if (activeTab.value === 'snippets') {
    await api.saveSnippets(JSON.parse(editorContent.value));
  } else {
    blueprints.activeContent = editorContent.value;
    await blueprints.save();
  }
}

async function createNew() {
  const id = `blueprint_${Date.now()}`;
  const template = { title: 'New Blueprint', subject: '', params: { size: '1024x1024', quality: 'low', model: '' } };
  await api.createBlueprint({ ...template, id });
  await blueprints.fetchList();
  await blueprints.select(id);
  editorContent.value = blueprints.activeContent;
  activeTab.value = 'blueprint';
}

async function deleteBlueprint(id: string) {
  if (!confirm(`Удалить blueprint "${id}"?`)) return;
  await api.deleteBlueprint(id);
  await blueprints.fetchList();
  if (blueprints.list.length) await blueprints.select(blueprints.list[0].id);
}
</script>

<style scoped>
.library-layout { display: flex; width: 100%; height: 100%; overflow: hidden; }
.lib-sidebar { width: 260px; min-width: 260px; background: var(--color-bg-surface); border-right: 1px solid var(--color-border); display: flex; flex-direction: column; overflow: hidden; }
.lib-editor { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.panel-header { padding: 10px 12px; font-size: 11px; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--color-border); display: flex; align-items: center; justify-content: space-between; }
.bp-list { overflow-y: auto; padding: 4px; }
.bp-item { display: flex; align-items: center; gap: 8px; padding: 7px 10px; border-radius: 5px; cursor: pointer; font-size: 13px; color: var(--color-text-muted); transition: background 0.15s; }
.bp-item:hover { background: var(--color-bg-hover); color: var(--color-text); }
.bp-item.active { background: var(--color-bg-panel); color: var(--color-text); }
.del-btn { margin-left: auto; opacity: 0; transition: opacity 0.15s; color: var(--color-danger); }
.bp-item:hover .del-btn { opacity: 1; }
.editor-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 8px 14px; background: var(--color-bg-surface); border-bottom: 1px solid var(--color-border); }
.editor-filename { font-size: 12px; color: var(--color-text-muted); font-family: monospace; }
.toolbar-actions { display: flex; gap: 8px; }
.btn-ghost { display: flex; align-items: center; gap: 5px; padding: 5px 10px; background: none; border: 1px solid var(--color-border); color: var(--color-text); border-radius: 5px; font-size: 12px; font-family: inherit; cursor: pointer; transition: background 0.15s; }
.btn-ghost:hover { background: var(--color-bg-hover); }
.editor-area { flex: 1; overflow: hidden; }
.icon-btn { background: none; border: none; color: var(--color-text-muted); cursor: pointer; padding: 3px; border-radius: 4px; display: flex; align-items: center; }
.icon-btn:hover { color: var(--color-text); }
</style>
