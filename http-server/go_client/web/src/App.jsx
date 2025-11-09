import React, { useState, useEffect, useCallback } from 'react'
import TextDataSettings from './components/TextDataSettings'
import TTSList from './components/TTSList'
import Sidebar from './components/Sidebar'
import AudioPlayer from './components/AudioPlayer'
import Footer from './components/Footer'
import { buildFileTree } from './utils/fileTree'
import { useNotification } from './utils/NotificationContext'
import { synthesizeTTS, fetchAudioFiles as fetchAudioFilesAPI, deleteAudioFile } from './service/api/tts'
import './App.css'

const App = () => {
  const [audioFiles, setAudioFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [fileTree, setFileTree] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [isSynthesizing, setIsSynthesizing] = useState(false)
  const [ttsJsonData, setTtsJsonData] = useState(null)
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null)
  const pauseCallbackRef = React.useRef(null) // To store the pause function from AudioPlayer

  const { showError, showSuccess } = useNotification()

  const fetchAudioFiles = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchAudioFilesAPI()
      setAudioFiles(data)
      setFileTree(buildFileTree(data))
    } catch (err) {
      showError('Error fetching audio files', err.message)
      console.error('Error fetching audio files:', err)
    } finally {
      setLoading(false)
    }
  }, [showError])

  useEffect(() => {
    fetchAudioFiles()
  }, [fetchAudioFiles])

  const handleFileSelect = (fileData) => {
    setSelectedFile(fileData)
    setAudioUrl(`http://localhost:8081${fileData.url}`)
    setCurrentlyPlaying(fileData.path) // Track currently playing file
  }

  const handlePlaybackComplete = () => {
    setCurrentlyPlaying(null) // Clear currently playing when playback completes
  }

  // Function to toggle the currently playing audio (play/pause)
  const handleToggleCurrent = () => {
    if (pauseCallbackRef.current) {
      // For now, we'll just call the pause function
      // To properly implement toggle, we need to know if audio is currently playing
      // This requires more complex state management between components
      pauseCallbackRef.current()
    } else {
      // If no pause callback is available, just select the current file again
      if (selectedFile) {
        handleFileSelect(selectedFile)
      }
    }
  }

  const handleSynthesize = useCallback(
    async (text) => {
      setIsSynthesizing(true)
      try {
        // Use the selected file's path as the speaker audio, or a default if none is selected.
        const speakerAudioPath = selectedFile?.path

        const result = await synthesizeTTS(text, speakerAudioPath)

        // Immediately select the new file for playback
        if (result.newFile) {
          handleFileSelect(result.newFile)
        }

        // Refresh the file list to show the new file in the sidebar
        await fetchAudioFiles()

        showSuccess('Audio synthesized successfully', 'The new audio file has been created.')
      } catch (err) {
        console.error('Error synthesizing audio:', err)
        showError('Error synthesizing audio', err.message)
      } finally {
        setIsSynthesizing(false)
      }
    },
    [fetchAudioFiles, selectedFile, showError, showSuccess]
  ) // Add selectedFile to the dependency array

  const handleDeleteFile = async (delname) => {
    console.log({ delname })
    try {
      await deleteAudioFile(delname)

      // Remove the file from the local state instead of re-fetching
      const new_audios = audioFiles.filter((file) => file.name !== delname)
      setAudioFiles(new_audios)
      setFileTree(buildFileTree(new_audios))

      // If the deleted file was currently selected, clear the selection
      if (selectedFile && selectedFile.path === delname) {
        setSelectedFile(null)
        setAudioUrl(null)
      }

      showSuccess('File deleted successfully', 'The file has been removed from the library.')
    } catch (err) {
      console.error('Error deleting file:', err)
      showError('Error deleting file', err.message)
    }
  }

  const handleJsonData = (jsonData) => {
    setTtsJsonData(jsonData)
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-800 cursor-default">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          audioFilesCount={audioFiles.length}
          loading={loading}
          fileTree={fileTree}
          onSelectFile={handleFileSelect}
          onDeleteFile={handleDeleteFile}
          onSynthesize={handleSynthesize}
          isSynthesizing={isSynthesizing}
          selectedFile={selectedFile} // Pass selectedFile down
          currentlyPlaying={currentlyPlaying}
          onPauseCurrent={handleToggleCurrent}
        />

        <div className="flex-1 flex flex-col">
          <TextDataSettings onUploadSuccess={fetchAudioFiles} onJsonData={handleJsonData} />
          <div className="flex-1">
            <TTSList jsonData={ttsJsonData} audioFiles={audioFiles} />
          </div>
          {
            <div style={{ height: 0 }}>
              <AudioPlayer
                selectedFile={selectedFile}
                audioUrl={audioUrl}
                onPlaybackComplete={handlePlaybackComplete}
                onPauseRequested={(callback) => {
                  pauseCallbackRef.current = callback
                }}
              />
            </div>
          }
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default App
