/**
 * Dubbing API Service
 * Handles communication with the backend Dubbing API
 */

const API_BASE_URL = 'http://localhost:8081'

/**
 * Fetch all voices
 * @returns {Promise<Array>} - List of voice objects
 */
export const fetchVoices = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/dubbings`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data.data.map((item) => ({ ...item, avatar: `/${item.avatar}`, wav_path: `/${item.wav_path}` })) || []
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

    const response = await fetch(`${API_BASE_URL}/api/dubbings`, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return result
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

    const response = await fetch(`${API_BASE_URL}/api/dubbings/${id}`, {
      method: 'PUT',
      body: formData
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return result
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
    const response = await fetch(`${API_BASE_URL}/api/dubbings/${id}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error deleting voice:', error)
    throw error
  }
}
