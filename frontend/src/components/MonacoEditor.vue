<template>
  <div ref="container" class="monaco-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import * as monaco from 'monaco-editor';

const props = defineProps<{
  modelValue: string;
  language?: string;
  readOnly?: boolean;
}>();

const emit = defineEmits<{ (e: 'update:modelValue', val: string): void }>();

const container = ref<HTMLElement | null>(null);
let editor: monaco.editor.IStandaloneCodeEditor | null = null;
let ignoreUpdate = false;

onMounted(() => {
  if (!container.value) return;

  editor = monaco.editor.create(container.value, {
    value: props.modelValue,
    language: props.language ?? 'json',
    theme: 'vs-dark',
    readOnly: props.readOnly ?? false,
    fontSize: 13,
    lineNumbers: 'on',
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    automaticLayout: true,
    tabSize: 2,
    fontFamily: 'Consolas, "Courier New", monospace',
  });

  editor.onDidChangeModelContent(() => {
    if (ignoreUpdate) return;
    emit('update:modelValue', editor!.getValue());
  });
});

watch(() => props.modelValue, (val) => {
  if (!editor) return;
  if (editor.getValue() === val) return;
  ignoreUpdate = true;
  editor.setValue(val);
  ignoreUpdate = false;
});

onBeforeUnmount(() => editor?.dispose());
</script>

<style scoped>
.monaco-container {
  width: 100%;
  height: 100%;
  min-height: 80px;
}
</style>
