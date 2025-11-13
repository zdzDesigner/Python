<template>
  <div class="flex flex-col h-screen bg-slate-50 text-slate-800 cursor-default">
    <div class="flex flex-1 overflow-hidden">
      <Sidebar
        :audio-files-count="audioFiles.length"
        :loading="loading"
        :file-tree="fileTree"
        @select-file="handleFileSelect"
        @delete-file="handleDeleteFile"
        @synthesize="handleSynthesize"
        :is-synthesizing="isSynthesizing"
        :selected-file="selectedFile"
        :currently-playing="currentlyPlaying"
        @pause-current="handleToggleCurrent"
      />

      <div class="flex-1 flex flex-col">
        <TextDataSettings @upload-success="fetchAudioFiles" @json-data="handleJsonData" />
        <div class="flex-1">
          <TTSList :json-data="ttsJsonData" :audio-files="audioFiles" @synthesize-complete="handleTTSListSynthesize" />
        </div>
        <div style="height: 0">
          <AudioPlayer
            :selected-file="selectedFile"
            :audio-url="audioUrl"
            @playback-complete="handlePlaybackComplete"
            @pause-requested="(callback) => (pauseCallbackRef = callback)"
          />
        </div>
      </div>
    </div>

    <Footer />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import TextDataSettings from './components/TextDataSettings.vue'
import TTSList from './components/TTSList.vue'
import Sidebar from './components/Sidebar.vue'
import AudioPlayer from './components/AudioPlayer.vue'
import Footer from './components/Footer.vue'
import { useNotification } from './utils/notifications'
import { useAudioStore } from './stores/audio'
import { synthesizeTTS, deleteAudioFile } from './services/api/tts'

const audioStore = useAudioStore()
const {
  audioFiles,
  loading,
  fileTree,
  selectedFile,
  isSynthesizing,
  currentlyPlaying,
} = storeToRefs(audioStore)
const { fetchAudioFiles, selectFile, setSynthesizing, deleteFileSuccess } = audioStore

const { showError, showSuccess } = useNotification()

const ttsJsonData = ref(null)
const pauseCallbackRef = ref(null)

const audioUrl = computed(() => (selectedFile.value ? `http://localhost:8081${selectedFile.value.url}` : null))

onMounted(() => {
  fetchAudioFiles()
})

const handleFileSelect = (fileData) => {
  selectFile(fileData)
}

const handlePlaybackComplete = () => {
  audioStore.setCurrentlyPlaying(null)
}

const handleToggleCurrent = () => {
  if (pauseCallbackRef.value) {
    pauseCallbackRef.value()
  } else if (selectedFile.value) {
    handleFileSelect(selectedFile.value)
  }
}

const handleSynthesize = async (text) => {
  setSynthesizing(true)
  try {
    const speakerAudioPath = selectedFile.value?.path
    const result = await synthesizeTTS(text, speakerAudioPath, null)
    if (result.newFile) {
      handleFileSelect(result.newFile)
    }
    await fetchAudioFiles()
    showSuccess('Audio synthesized successfully', 'The new audio file has been created.')
  } catch (err) {
    console.error('Error synthesizing audio:', err)
    showError('Error synthesizing audio', err.message)
  } finally {
    setSynthesizing(false)
  }
}

const handleDeleteFile = async (delname) => {
  try {
    await deleteAudioFile(delname)
    deleteFileSuccess(delname)
    showSuccess('File deleted successfully', 'The file has been removed from the library.')
  } catch (err) {
    console.error('Error deleting file:', err)
    showError('Error deleting file', err.message)
  }
}

const handleJsonData = (jsonData) => {
  ttsJsonData.value = jsonData
}

const handleTTSListSynthesize = async (synthesizedFile) => {
  if (synthesizedFile) {
    handleFileSelect(synthesizedFile)
    await fetchAudioFiles()
    showSuccess('Audio synthesized successfully', 'The new audio file has been created.')
  }
}
</script>