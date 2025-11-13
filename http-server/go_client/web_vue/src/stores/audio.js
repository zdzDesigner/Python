import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchAudioFiles as fetchAudioFilesAPI } from '@/services/api/tts'
import { buildFileTree } from '@/utils/fileTree'

export const useAudioStore = defineStore('audio', () => {
  const audioFiles = ref([])
  const loading = ref(true)
  const selectedFile = ref(null)
  const isSynthesizing = ref(false)
  const currentlyPlaying = ref(null)
  const error = ref(null)

  const fileTree = computed(() => buildFileTree(audioFiles.value))

  async function fetchAudioFiles() {
    loading.value = true
    error.value = null
    try {
      const data = await fetchAudioFilesAPI()
      audioFiles.value = data
    } catch (err) {
      error.value = err.message
      console.error('Error fetching audio files:', err)
    } finally {
      loading.value = false
    }
  }

  function selectFile(fileData) {
    selectedFile.value = fileData
    currentlyPlaying.value = fileData ? fileData.path : null
  }

  function setSynthesizing(status) {
    isSynthesizing.value = status
  }

  function setCurrentlyPlaying(path) {
    currentlyPlaying.value = path
  }

  function deleteFileSuccess(filePath) {
    audioFiles.value = audioFiles.value.filter((file) => file.name !== filePath)
    if (selectedFile.value && selectedFile.value.name === filePath) {
      selectedFile.value = null
    }
  }

  return {
    audioFiles,
    loading,
    selectedFile,
    isSynthesizing,
    currentlyPlaying,
    error,
    fileTree,
    fetchAudioFiles,
    selectFile,
    setSynthesizing,
    setCurrentlyPlaying,
    deleteFileSuccess,
  }
})
