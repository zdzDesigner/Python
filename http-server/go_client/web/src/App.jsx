import React, { useState, useCallback, useMemo, useRef } from 'react'
import TextDataSettings from './components/TextDataSettings'
import TTSList from './components/TTSList'
import Sidebar from './components/Sidebar'
import AudioPlayer from './components/AudioPlayer'
import Footer from './components/Footer'
import { useNotification } from './utils/NotificationContext'
import { useAudioLibraryState, useAudioLibraryDispatch } from './context/AudioLibraryContext'
import { synthesizeTTS, deleteAudioFile } from './service/api/tts'
import './App.css'

const App = () => {
  const { audioFiles, loading, fileTree, selectedFile, isSynthesizing, currentlyPlaying } = useAudioLibraryState()
  const { dispatch, fetchAudioFiles } = useAudioLibraryDispatch()
  const { showError, showSuccess } = useNotification()

  const [ttsJsonData, setTtsJsonData] = useState(null)
  const pauseCallbackRef = useRef(null)

  const audioUrl = useMemo(() => (selectedFile ? `http://localhost:8081${selectedFile.url}` : null), [selectedFile])

  const handleFileSelect = useCallback(
    (fileData) => {
      dispatch({ type: 'SELECT_FILE', payload: fileData })
    },
    [dispatch]
  )

  const handlePlaybackComplete = useCallback(() => {
    dispatch({ type: 'SET_CURRENTLY_PLAYING', payload: null })
  }, [dispatch])

  const handleToggleCurrent = useCallback(() => {
    if (pauseCallbackRef.current) {
      pauseCallbackRef.current()
    } else if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }, [selectedFile, handleFileSelect])

  const handleSynthesize = useCallback(
    async (text) => {
      dispatch({ type: 'SET_SYNTHESIZING', payload: true })
      try {
        const speakerAudioPath = selectedFile?.path
        const result = await synthesizeTTS({ content: text, speaker: '', dubbing: speakerAudioPath })
        if (result.newFile) {
          handleFileSelect(result.newFile)
        }
        await fetchAudioFiles()
        showSuccess('Audio synthesized successfully', 'The new audio file has been created.')
      } catch (err) {
        console.error('Error synthesizing audio:', err)
        showError('Error synthesizing audio', err.message)
      } finally {
        dispatch({ type: 'SET_SYNTHESIZING', payload: false })
      }
    },
    [dispatch, fetchAudioFiles, selectedFile, showError, showSuccess, handleFileSelect]
  )

  const handleDeleteFile = useCallback(
    async (delname) => {
      try {
        await deleteAudioFile(delname)
        dispatch({ type: 'DELETE_FILE_SUCCESS', payload: delname })
        showSuccess('File deleted successfully', 'The file has been removed from the library.')
      } catch (err) {
        console.error('Error deleting file:', err)
        showError('Error deleting file', err.message)
      }
    },
    [dispatch, showError, showSuccess]
  )

  const handleJsonData = useCallback((jsonData) => {
    setTtsJsonData(jsonData)
  }, [])

  const handleTTSListSynthesize = useCallback(
    async (synthesizedFile) => {
      if (synthesizedFile) {
        handleFileSelect(synthesizedFile)
        await fetchAudioFiles()
        showSuccess('Audio synthesized successfully', 'The new audio file has been created.')
      }
    },
    [handleFileSelect, fetchAudioFiles, showSuccess]
  )

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
          selectedFile={selectedFile}
          currentlyPlaying={currentlyPlaying}
          onPauseCurrent={handleToggleCurrent}
        />

        <div className="flex-1 flex flex-col">
          <TextDataSettings onUploadSuccess={fetchAudioFiles} onJsonData={handleJsonData} />
          <div className="flex-1">
            <TTSList jsonData={ttsJsonData} audioFiles={audioFiles} onSynthesizeComplete={handleTTSListSynthesize} />
          </div>
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
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default App
