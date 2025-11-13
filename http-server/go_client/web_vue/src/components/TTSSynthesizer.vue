<template>
  <div class="p-4 border-t border-slate-200">
    <form @submit.prevent="handleSubmit">
      <textarea
        v-model="text"
        class="w-full h-24 p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow duration-200 resize-none"
        placeholder="Enter text to synthesize..."
        :disabled="isSynthesizing"
      />

      <button
        type="submit"
        :disabled="isSynthesizing || !text.trim()"
        class="mt-3 w-full flex justify-center items-center bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 disabled:bg-slate-400 disabled:cursor-not-allowed"
      >
        <template v-if="isSynthesizing">
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Generating...
        </template>
        <template v-else>
          Generate Audio
        </template>
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  isSynthesizing: Boolean,
  selectedFile: Object,
})

const emit = defineEmits(['synthesize'])

const text = ref('你好，这是一个在网页上生成的语音。')

const referenceVoice = computed(() => (props.selectedFile ? props.selectedFile.name.split('/').pop() : 'Default'))

const handleSubmit = () => {
  if (!text.value.trim() || props.isSynthesizing) return
  emit('synthesize', text.value)
}
</script>
