import React, { useState, useCallback, useMemo, useRef } from 'react'
import { useAudioLibraryState, useAudioLibraryDispatch } from '@/context/AudioLibraryContext'
import { useNotification } from '@/utils/NotificationContext'
import { synthesizeTTS, deleteAudioFile } from '@/service/api/tts'
import Sidebar from '@/components/Sidebar'
import AudioPlayer from '@/components/AudioPlayer'

export const DubbingList = () => {
  const { dispatch, fetchAudioFiles } = useAudioLibraryDispatch()
  const { showError, showSuccess } = useNotification()
  const pauseCallbackRef = useRef(null)
  const { audioFiles, loading, fileTree, selectedFile, isSynthesizing, currentlyPlaying } = useAudioLibraryState()
  const audioUrl = useMemo(() => (selectedFile ? `http://localhost:8081${selectedFile.url}` : null), [selectedFile])

  const handleFileSelect = useCallback(
    (fileData) => {
      dispatch({ type: 'SELECT_FILE', payload: fileData })
    },
    [dispatch]
  )

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

  const handlePlaybackComplete = useCallback(() => {
    dispatch({ type: 'SET_CURRENTLY_PLAYING', payload: null })
  }, [dispatch])
  return (
    <>
      {
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
      }
      <div style={{ height: 0 }} className="overflow-hidden">
        <AudioPlayer
          selectedFile={selectedFile}
          audioUrl={audioUrl}
          onPlaybackComplete={handlePlaybackComplete}
          onPauseRequested={(callback) => {
            pauseCallbackRef.current = callback
          }}
        />
      </div>
    </>
  )
}
