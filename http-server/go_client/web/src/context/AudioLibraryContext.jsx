import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { buildFileTree } from '@/utils/fileTree'
import { fetchAudioFiles as fetchAudioFilesAPI } from '@/service/api/tts'

// 1. Define Contexts
const AudioLibraryStateContext = createContext(null)
const AudioLibraryDispatchContext = createContext(null)

// 2. Define Initial State
const initialState = {
  audioFiles: [],
  fileTree: null,
  loading: true,
  selectedFile: null,
  isSynthesizing: false,
  currentlyPlaying: null,
  error: null
}

// 3. Define Reducer
function audioLibraryReducer(state, action) {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null }
    case 'FETCH_SUCCESS':
      return {
        ...state,
        loading: false,
        audioFiles: action.payload,
        fileTree: buildFileTree(action.payload)
      }
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload }
    case 'SELECT_FILE':
      return {
        ...state,
        selectedFile: action.payload,
        currentlyPlaying: action.payload ? action.payload.path : null
      }
    case 'SET_SYNTHESIZING':
      return { ...state, isSynthesizing: action.payload }
    case 'SET_CURRENTLY_PLAYING':
      return { ...state, currentlyPlaying: action.payload }
    case 'DELETE_FILE_SUCCESS': {
      const newAudioFiles = state.audioFiles.filter((file) => file.name !== action.payload)
      let newSelectedFile = state.selectedFile
      if (state.selectedFile && state.selectedFile.name === action.payload) {
        newSelectedFile = null
      }
      return {
        ...state,
        audioFiles: newAudioFiles,
        fileTree: buildFileTree(newAudioFiles),
        selectedFile: newSelectedFile
      }
    }
    default:
      throw new Error(`Unhandled action type: ${action.type}`)
  }
}

// 4. Create Provider Component
export const AudioLibraryProvider = ({ children }) => {
  const [state, dispatch] = useReducer(audioLibraryReducer, initialState)

  // The notification hook is used here, so we pass it as a dependency
  // For simplicity in this refactor, we assume it's available or passed down if needed.
  // A better approach might be to have a combined AppProvider.

  const fetchAudioFiles = useCallback(async () => {
    dispatch({ type: 'FETCH_START' })
    try {
      const data = await fetchAudioFilesAPI()
      dispatch({ type: 'FETCH_SUCCESS', payload: data })
    } catch (err) {
      dispatch({ type: 'FETCH_ERROR', payload: err.message })
      console.error('Error fetching audio files:', err)
      // Here you would ideally call showError from useNotification
    }
  }, [])

  useEffect(() => {
    fetchAudioFiles()
  }, [fetchAudioFiles])

  return (
    <AudioLibraryStateContext.Provider value={state}>
      <AudioLibraryDispatchContext.Provider value={{ dispatch, fetchAudioFiles }}>
        {children}
      </AudioLibraryDispatchContext.Provider>
    </AudioLibraryStateContext.Provider>
  )
}

// 5. Create Custom Hooks
export const useAudioLibraryState = () => {
  const context = useContext(AudioLibraryStateContext)
  if (context === undefined) {
    throw new Error('useAudioLibraryState must be used within a AudioLibraryProvider')
  }
  return context
}

export const useAudioLibraryDispatch = () => {
  const context = useContext(AudioLibraryDispatchContext)
  if (context === undefined) {
    throw new Error('useAudioLibraryDispatch must be used within a AudioLibraryProvider')
  }
  return context
}
