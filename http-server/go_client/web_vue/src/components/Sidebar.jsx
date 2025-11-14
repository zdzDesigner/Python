
import FileTree from './FileTree.jsx';
import TTSSynthesizer from './TTSSynthesizer.jsx';

const LoadingSpinner = {
  template: `
    <div class="flex flex-col items-center justify-center h-full text-slate-500">
      <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      <span class="mt-4 text-lg">Loading Library...</span>
    </div>
  `,
};

export default {
  props: {
    audioFilesCount: Number,
    loading: Boolean,
    fileTree: Object,
    isSynthesizing: Boolean,
    selectedFile: Object,
    currentlyPlaying: String,
  },
  emits: ['selectFile', 'deleteFile', 'synthesize', 'pauseCurrent'],
  setup(props, { emit }) {
    return () => (
      <aside class="w-[300px] bg-white/80 backdrop-blur-lg border-r border-slate-200 flex flex-col">
        <div class="flex-1 overflow-y-auto p-2">
          {props.loading ? (
            <LoadingSpinner />
          ) : (
            <FileTree
              file-tree={props.fileTree}
              onSelectFile={(event) => emit('selectFile', event)}
              onDeleteFile={(event) => emit('deleteFile', event)}
              currently-playing={props.currentlyPlaying}
              onPauseCurrent={() => emit('pauseCurrent')}
            />
          )}
        </div>
        <TTSSynthesizer
          onSynthesize={(event) => emit('synthesize', event)}
          is-synthesizing={props.isSynthesizing}
          selected-file={props.selectedFile}
        />
      </aside>
    );
  },
};
