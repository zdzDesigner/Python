import React, { useState, useEffect, useCallback } from 'react'
import TextDataSettings from './components/TextDataSettings'
import TTSList from './components/TTSList'
import Sidebar from './components/Sidebar'
import AudioPlayer from './components/AudioPlayer'
import Footer from './components/Footer'
import { buildFileTree } from './utils/fileTree'
import { useNotification } from './utils/NotificationContext'
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
      const response = await fetch('http://localhost:8081/api/audio-files')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setAudioFiles(data.files || [])
      setFileTree(buildFileTree(data.files))
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

        const requestBody = {
          text: text,
          speaker_audio_path: speakerAudioPath,
          output_wav_path: '', // The backend will generate the path
          emotion_text: 'default',
          emotion_alpha: 0.7,
          interval_silence: 500
        }

        const response = await fetch('http://localhost:8081/api/tts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        })

        if (!response.ok) {
          const errorBody = await response.text()
          throw new Error(`TTS API error! status: ${response.status}, body: ${errorBody}`)
        }

        const result = await response.json()

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
      const response = await fetch('http://localhost:8081/api/delete-file', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ path: delname })
      })

      if (!response.ok) {
        throw new Error(`Delete API error! status: ${response.status}`)
      }

      // await fetchAudioFiles()

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
          {
            <div style={{ height: 300 }}>
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
          <div className="flex-1">
            <TTSList jsonData={ttsJsonData} />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default App
