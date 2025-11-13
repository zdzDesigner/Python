
import { ref, watch, onMounted } from 'vue';

export default {
  props: {
    selectedFile: Object,
    audioUrl: String,
  },
  emits: ['playbackComplete', 'pauseRequested'],
  setup(props, { emit }) {
    const audioRef = ref(null);
    const isPlaying = ref(false);
    const progress = ref(0);

    const getIcon = () => {
      if (!props.selectedFile) return '🎵';
      const extension = props.selectedFile.name.split('.').pop().toLowerCase();
      switch (extension) {
        case 'mp3':
          return '🎵';
        case 'wav':
          return '🔊';
        case 'ogg':
          return '🎶';
        case 'flac':
          return '🎼';
        default:
          return '🎵';
      }
    };

    const handlePlaybackComplete = () => {
      emit('playbackComplete');
      isPlaying.value = false;
      progress.value = 0;
    };

    const togglePlayPause = () => {
      if (audioRef.value) {
        if (isPlaying.value) {
          audioRef.value.pause();
        } else {
          audioRef.value.play();
        }
      }
    };

    const updateProgress = () => {
      if (audioRef.value && audioRef.value.duration) {
        progress.value = (audioRef.value.currentTime / audioRef.value.duration) * 100;
      }
    };

    const handleLoadedMetadata = () => {
      progress.value = 0;
    };

    const handlePlay = () => {
      isPlaying.value = true;
    };

    const handlePause = () => {
      isPlaying.value = false;
    };

    watch(() => props.audioUrl, (newUrl) => {
      if (newUrl) {
        progress.value = 0;
        isPlaying.value = false;
        if (audioRef.value) {
          audioRef.value.load();
          audioRef.value.play();
        }
      }
    });

    onMounted(() => {
      emit('pauseRequested', () => {
        if (audioRef.value) {
          togglePlayPause();
        }
      });
    });

    return () => (
      <main class="flex-1 flex flex-col overflow-hidden bg-slate-100/50">
        <div class="flex-1 overflow-y-auto p-6">
          {props.selectedFile ? (
            <div class="max-w-3xl mx-auto animate-fade-in">
              <div class="bg-white rounded-2xl shadow-xl overflow-hidden ring-1 ring-slate-200/50">
                <div class="p-6 bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-center">
                  <div class="text-5xl mb-3 animate-bounce-short">{getIcon()}</div>
                  <h3 class="font-bold text-xl truncate" title={props.selectedFile.name}>
                    {props.selectedFile.name.split('/').pop()}
                  </h3>
                </div>

                <div class="p-6">
                  {props.audioUrl && (
                    <div class="mb-6">
                      <div class="mb-2">
                        <div class="w-full bg-gray-200 rounded-full h-1.5">
                          <div class="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${progress.value}%` }}></div>
                        </div>
                      </div>
                      <div class="flex items-center space-x-4">
                        <button
                          onClick={togglePlayPause}
                          class="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full w-12 h-12 flex items-center justify-center transition-colors duration-200"
                        >
                          <span class="text-xl">{isPlaying.value ? '⏸' : '▶'}</span>
                        </button>
                        <audio
                          ref={audioRef}
                          controls={false}
                          class="w-full h-14"
                          key={props.selectedFile.path}
                          onEnded={handlePlaybackComplete}
                          onTimeupdate={updateProgress}
                          onLoadedmetadata={handleLoadedMetadata}
                          onPlay={handlePlay}
                          onPause={handlePause}
                        >
                          <source src={props.audioUrl} type={`audio/${props.selectedFile.name.split('.').pop()}`} />
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    </div>
                  )}

                  <div class="space-y-4">
                    <div class="bg-slate-50/80 p-4 rounded-lg ring-1 ring-slate-200/50">
                      <h4 class="font-semibold text-slate-600 mb-2">File Details</h4>
                      <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p class="text-xs text-slate-500">Name</p>
                          <p class="font-medium text-slate-800">{props.selectedFile.name.split('/').pop()}</p>
                        </div>
                        <div>
                          <p class="text-xs text-slate-500">Type</p>
                          <p class="font-medium text-slate-800">{props.selectedFile.name.split('.').pop().toUpperCase()}</p>
                        </div>
                      </div>
                    </div>

                    <div class="bg-slate-50/80 p-4 rounded-lg ring-1 ring-slate-200/50">
                      <h4 class="font-semibold text-slate-600 mb-2">Full Path</h4>
                      <p class="font-mono text-xs break-all bg-white p-3 rounded border border-slate-200">{props.selectedFile.path}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div class="flex items-center justify-center h-full text-center text-slate-500">
              <div class="bg-white/50 backdrop-blur-sm p-12 rounded-3xl ring-1 ring-slate-200/80 shadow-lg animate-fade-in">
                <div class="text-7xl mb-5">🎧</div>
                <h3 class="text-2xl font-semibold text-slate-800">Select an Audio File</h3>
                <p class="mt-2 text-base text-slate-600">Choose a file from the library to start playing.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    );
  },
};
