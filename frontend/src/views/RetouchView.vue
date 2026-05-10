<template>
  <div class="retouch-layout">
    <!-- Левая колонка: Source Explorer -->
    <SourceExplorer />

    <!-- Центр: Workspace -->
    <div class="workspace">
      <ReviewCompare
        v-if="reviewMode && reviewEntry"
        :entry="reviewEntry"
        @close="reviewMode = false"
      />
      <WorkspaceGrid
        v-else
        @review="openReview"
      />
    </div>

    <!-- Правая колонка: Inspector -->
    <Inspector @started="reviewMode = false" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import SourceExplorer from '@/components/SourceExplorer.vue';
import WorkspaceGrid from '@/components/WorkspaceGrid.vue';
import ReviewCompare from '@/components/ReviewCompare.vue';
import Inspector from '@/components/Inspector.vue';
import type { RegistryEntry } from '@/api';

const reviewMode = ref(false);
const reviewEntry = ref<RegistryEntry | null>(null);

function openReview(entry: RegistryEntry) {
  reviewEntry.value = entry;
  reviewMode.value = true;
}
</script>

<style scoped>
.retouch-layout {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.workspace {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-base);
}
</style>
