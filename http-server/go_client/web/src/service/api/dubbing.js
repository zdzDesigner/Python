/**
 * Dubbing API Service
 * Handles communication with the backend Dubbing API
 */

import { methods } from './method.js'

const patchServerPath = ({ avatar, wav_path, ...more }) => ({ ...more, avatar: !!avatar ? `/${avatar}` : '', wav_path: !!wav_path ? `/${wav_path}` : '' })
const unpatchServerPath = (item) => ({ ...item, avatar: item.avatar?.substring(1), wav_path: item.wav_path?.substring(1) })
/**
 * Fetch all voices
 * @returns {Promise<Array>} - List of voice objects
 */
export const fetchVoices = async () => {
  try {
    const data = await methods.get('/dubbings?size=100&page=1')
    return data.map(patchServerPath) || []
  } catch (error) {
    console.error('Error fetching voices:', error)
    throw error
  }
}

/**
 * Create a new voice with file uploads
 * @param {Object} voiceData - Voice data object
 * @param {File} avatarFile - Avatar file (optional)
 * @param {File} wavFile - WAV file (optional)
 * @returns {Promise<Object>} - API response
 */
export const createVoice = async (voiceData, avatarFile = null, wavFile = null) => {
  try {
    const formData = new FormData()

    // Append text fields
    formData.append('name', voiceData.name || '')
    formData.append('age_text', voiceData.age_text || '')
    formData.append('emotion_text', voiceData.emotion_text || '')
    formData.append('avatar', voiceData.avatar || '')
    formData.append('wav_path', voiceData.wav_path || '')

    // Append files if provided
    if (avatarFile) {
      formData.append('avatar_file', avatarFile)
    }

    if (wavFile) {
      formData.append('wav_file', wavFile)
    }

    const response = await methods.form('/dubbings', formData)
    return response
  } catch (error) {
    console.error('Error creating voice:', error)
    throw error
  }
}

/**
 * Update a voice with file uploads
 * @param {number} id - Voice ID
 * @param {Object} voiceData - Voice data object
 * @param {File} avatarFile - Avatar file (optional)
 * @param {File} wavFile - WAV file (optional)
 * @returns {Promise<Object>} - API response
 */
export const updateVoice = async (id, voiceData, avatarFile = null, wavFile = null) => {
  try {
    const formData = new FormData()

    console.log({ voiceData })
    const { avatar, wav_path } = unpatchServerPath(voiceData)
    console.log({ avatar, wav_path })
    // Append text fields
    formData.append('name', voiceData.name || '')
    formData.append('age_text', voiceData.age_text || '')
    formData.append('emotion_text', voiceData.emotion_text || '')
    formData.append('avatar', avatar || '')
    formData.append('wav_path', wav_path || '')

    // Append files if provided
    if (avatarFile) {
      formData.append('avatar_file', avatarFile)
    }

    if (wavFile) {
      formData.append('wav_file', wavFile)
    }

    const response = await methods.form(`/dubbings/${id}`, formData, 'PUT')
    return response
  } catch (error) {
    console.error('Error updating voice:', error)
    throw error
  }
}

/**
 * Delete a voice
 * @param {number} id - Voice ID
 * @returns {Promise<Object>} - API response
 */
export const deleteVoice = async (id) => {
  try {
    const response = await methods.delete(`/dubbings/${id}`)
    return response
  } catch (error) {
    console.error('Error deleting voice:', error)
    throw error
  }
}

/**
 * Batch upload audio files
 * @param {FileList} audioFiles - Array of audio files
 * @returns {Promise<Object>} - API response with upload results
 */
export const batchUploadVoices = async (audioFiles) => {
  try {
    const formData = new FormData()

    // Append all audio files
    for (let i = 0; i < audioFiles.length; i++) {
      formData.append('audio_files', audioFiles[i])
    }

    const response = await methods.form('/dubbings/batch', formData)
    return response
  } catch (error) {
    console.error('Error batch uploading voices:', error)
    throw error
  }
}
