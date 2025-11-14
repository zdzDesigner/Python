import { ref, computed, onMounted, defineComponent } from 'vue';
import { storeToRefs } from 'pinia';
import TextDataSettings from './components/TextDataSettings.jsx';
import TTSList from './components/TTSList.jsx';
import Sidebar from './components/Sidebar.jsx';
import AudioPlayer from './components/AudioPlayer.jsx';
import Footer from './components/Footer.jsx';
import { useNotification } from './utils/notifications';
import { useAudioStore } from './stores/audio';
import { synthesizeTTS, deleteAudioFile } from './services/api/tts';

export default defineComponent({
  setup() {
    const audioStore = useAudioStore();
    const {
      audioFiles,
      loading,
      fileTree,
      selectedFile,
      isSynthesizing,
      currentlyPlaying,
    } = storeToRefs(audioStore);
    const { fetchAudioFiles, selectFile, setSynthesizing, deleteFileSuccess } = audioStore;

    const { showError, showSuccess } = useNotification();

    const ttsJsonData = ref(null);
    const pauseCallbackRef = ref(null);

    const audioUrl = computed(() => (selectedFile.value ? `http://localhost:8081${selectedFile.value.url}` : null));

    onMounted(() => {
      fetchAudioFiles();
    });

    const handleFileSelect = (fileData) => {
      selectFile(fileData);
    };

    const handlePlaybackComplete = () => {
      audioStore.setCurrentlyPlaying(null);
    };

    const handleToggleCurrent = () => {
      if (pauseCallbackRef.value) {
        pauseCallbackRef.value();
      } else if (selectedFile.value) {
        handleFileSelect(selectedFile.value);
      }
    };

    const handleSynthesize = async (text) => {
      setSynthesizing(true);
      try {
        const speakerAudioPath = selectedFile.value?.path;
        const result = await synthesizeTTS(text, speakerAudioPath, null);
        if (result.newFile) {
          handleFileSelect(result.newFile);
        }
        await fetchAudioFiles();
        showSuccess('Audio synthesized successfully', 'The new audio file has been created.');
      } catch (err) {
        console.error('Error synthesizing audio:', err);
        showError('Error synthesizing audio', err.message);
      } finally {
        setSynthesizing(false);
      }
    };

    const handleDeleteFile = async (delname) => {
      try {
        await deleteAudioFile(delname);
        deleteFileSuccess(delname);
        showSuccess('File deleted successfully', 'The file has been removed from the library.');
      } catch (err) {
        console.error('Error deleting file:', err);
        showError('Error deleting file', err.message);
      }
    };

    const handleJsonData = (jsonData) => {
      ttsJsonData.value = jsonData;
    };

    const handleTTSListSynthesize = async (synthesizedFile) => {
      if (synthesizedFile) {
        handleFileSelect(synthesizedFile);
        await fetchAudioFiles();
        showSuccess('Audio synthesized successfully', 'The new audio file has been created.');
      }
    };

    return () => (
      <div class="flex flex-col h-screen bg-slate-50 text-slate-800 cursor-default">
        <div class="flex flex-1 overflow-hidden">
          <Sidebar
            audioFilesCount={audioFiles.value.length}
            loading={loading.value}
            fileTree={fileTree.value}
            isSynthesizing={isSynthesizing.value}
            selectedFile={selectedFile.value}
            currentlyPlaying={currentlyPlaying.value}
            onSelectFile={handleFileSelect}
            onDeleteFile={handleDeleteFile}
            onSynthesize={handleSynthesize}
            onPauseCurrent={handleToggleCurrent}
          />

          <div class="flex-1 flex flex-col">
            <TextDataSettings onUploadSuccess={fetchAudioFiles} onJsonData={handleJsonData} />
            <div class="flex-1">
              <TTSList jsonData={ttsJsonData.value} audioFiles={audioFiles.value} onSynthesizeComplete={handleTTSListSynthesize} />
            </div>
            <div style={{ height: '0' }}>
              <AudioPlayer
                selectedFile={selectedFile.value}
                audioUrl={audioUrl.value}
                onPlaybackComplete={handlePlaybackComplete}
                onPauseRequested={(callback) => (pauseCallbackRef.value = callback)}
              />
            </div>
          </div>
        </div>

        <Footer />
      </div>
    );
  },
});
