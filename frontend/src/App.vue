<template>
  <div class="app-shell">
    <header class="topbar">
      <nav class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.path"
          class="tab-btn"
          :class="{ active: $route.path === tab.path }"
          @click="router.push(tab.path)"
        >
          <component :is="tab.icon" :size="14" />
          {{ tab.label }}
        </button>
      </nav>

      <div class="topbar-right">
        <span class="server-badge">
          <span class="dot"></span>
          Local :{{ port }}
        </span>
        <button class="icon-btn" title="API Settings" @click="showSettings = true">
          <Settings :size="16" />
        </button>
      </div>
    </header>

    <main class="main-content">
      <router-view />
    </main>

    <SettingsModal v-if="showSettings" @close="showSettings = false" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Settings, Wand2, ImagePlus, History } from 'lucide-vue-next';
import SettingsModal from '@/components/SettingsModal.vue';

const router = useRouter();
const route = useRoute();
const showSettings = ref(false);
const port = ref(window.location.port || 3000);

const tabs = [
  { path: '/',         label: 'Ретушь',    icon: Wand2 },
  { path: '/generate', label: 'Генерация', icon: ImagePlus },
  { path: '/history',  label: 'История',   icon: History },
];
</script>

<style scoped>
.app-shell { display: flex; flex-direction: column; height: 100vh; overflow: hidden; background: var(--color-bg-base); }
.topbar { display: flex; align-items: center; justify-content: space-between; height: 48px; min-height: 48px; padding: 0 12px; background: var(--color-bg-surface); border-bottom: 1px solid var(--color-border); gap: 8px; z-index: 100; }
.tabs { display: flex; gap: 2px; }
.tab-btn { display: flex; align-items: center; gap: 6px; padding: 6px 14px; background: none; border: none; border-radius: 6px; color: var(--color-text-muted); font-size: 13px; font-family: inherit; cursor: pointer; transition: color 0.15s, background 0.15s; }
.tab-btn:hover { background: var(--color-bg-hover); color: var(--color-text); }
.tab-btn.active { background: var(--color-bg-panel); color: var(--color-text); }
.topbar-right { display: flex; align-items: center; gap: 10px; }
.server-badge { display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--color-text-muted); }
.dot { width: 7px; height: 7px; border-radius: 50%; background: var(--color-success); }
.icon-btn { background: none; border: none; color: var(--color-text-muted); cursor: pointer; padding: 4px; border-radius: 4px; display: flex; align-items: center; transition: color 0.15s; }
.icon-btn:hover { color: var(--color-text); }
.main-content { flex: 1; overflow: hidden; display: flex; }
</style>
