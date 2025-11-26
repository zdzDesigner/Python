import React, { useState, useCallback, useMemo, useRef } from 'react'
import TextDataSettings from '@/components/TextDataSettings'
import TTSList from '@/components/TTSList'
import SectionList from '@/components/SectionList'
import Progress from '@/components/Progress'
import { useNotification } from '@/utils/NotificationContext'
import { useAudioLibraryState, useAudioLibraryDispatch } from '@/context/AudioLibraryContext'

export const AudioSection = () => {
  const { audioFiles, loading, fileTree, selectedFile, isSynthesizing, currentlyPlaying } = useAudioLibraryState()
  const { dispatch, fetchAudioFiles } = useAudioLibraryDispatch()
  const { showError, showSuccess } = useNotification()

  const [ttsJsonData, setTtsJsonData] = useState(null)

  const handleFileSelect = useCallback(
    (fileData) => {
      dispatch({ type: 'SELECT_FILE', payload: fileData })
    },
    [dispatch]
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
    <div className="flex h-screen bg-slate-50 text-slate-800 cursor-default">
      <div className="flex flex-col w-full h-full">
        {<TextDataSettings onUploadSuccess={fetchAudioFiles} onJsonData={handleJsonData} />}
        <div className="flex flex-1">
          <SectionList />
          <div className="pl-1 overflow-auto">
            <TTSList jsonData={ttsJsonData} audioFiles={audioFiles} onSynthesizeComplete={handleTTSListSynthesize} />
          </div>
        </div>
        <Progress />
      </div>
    </div>
  )
}
