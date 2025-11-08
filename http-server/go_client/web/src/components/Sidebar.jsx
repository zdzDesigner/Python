import React from 'react'
import FileTree from './FileTree'
import TtsSynthesizer from './TtsSynthesizer' // Import the new component

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center h-full text-slate-500">
    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
    <span className="mt-4 text-lg">Loading Library...</span>
  </div>
)

// Add onSynthesize, isSynthesizing, and selectedFile to the props
const Sidebar = ({ audioFilesCount, loading, fileTree, onSelectFile, onDeleteFile, onSynthesize, isSynthesizing, selectedFile, currentlyPlaying }) => {
  return (
    <aside className="w-[300px] bg-white/80 backdrop-blur-lg border-r border-slate-200 flex flex-col">
      {
        // <div className="p-4 border-b border-slate-200">
        //   <h2 className="text-lg font-semibold flex items-center text-slate-800">
        //     <svg className="w-6 h-6 mr-2.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        //       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
        //     </svg>
        //     Audio Library
        //     <span className="ml-auto bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-1 rounded-full">{audioFilesCount} files</span>
        //   </h2>
        // </div>
      }
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? <LoadingSpinner /> : <FileTree fileTree={fileTree} onSelectFile={onSelectFile} onDeleteFile={onDeleteFile} currentlyPlaying={currentlyPlaying} />}
      </div>
      {/* Add the TTS component at the bottom, passing the selectedFile prop */}
      <TtsSynthesizer onSynthesize={onSynthesize} isSynthesizing={isSynthesizing} selectedFile={selectedFile} />
    </aside>
  )
}

export default Sidebar
