<template>
  <aside class="w-[300px] bg-white/80 backdrop-blur-lg border-r border-slate-200 flex flex-col">
    <div class="flex-1 overflow-y-auto p-2">
      <LoadingSpinner v-if="loading" />
      <FileTree
        v-else
        :file-tree="fileTree"
        @select-file="emit('selectFile', $event)"
        @delete-file="emit('deleteFile', $event)"
        :currently-playing="currentlyPlaying"
        @pause-current="emit('pauseCurrent')"
      />
    </div>
    <TTSSynthesizer
      @synthesize="emit('synthesize', $event)"
      :is-synthesizing="isSynthesizing"
      :selected-file="selectedFile"
    />
  </aside>
</template>

<script setup>
import FileTree from './FileTree.vue'
import TTSSynthesizer from './TTSSynthesizer.vue'

const props = defineProps({
  audioFilesCount: Number,
  loading: Boolean,
  fileTree: Object,
  isSynthesizing: Boolean,
  selectedFile: Object,
  currentlyPlaying: String,
})

const emit = defineEmits(['selectFile', 'deleteFile', 'synthesize', 'pauseCurrent'])

const LoadingSpinner = {
  template: `
    <div class="flex flex-col items-center justify-center h-full text-slate-500">
      <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      <span class="mt-4 text-lg">Loading Library...</span>
    </div>
  `,
}
</script>
