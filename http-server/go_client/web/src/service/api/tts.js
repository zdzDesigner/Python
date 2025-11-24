/**
 * TTS (Text-to-Speech) API Service
 * Handles communication with the backend TTS API
 */

const API_BASE_URL = 'http://localhost:8081'

export const MAP_TTS = {
  content: 'text',
  tone: 'emotion_text',
  intensity: 'emotion_alpha',
  delay: 'interval_silence',
  truncate: 'audio_end_truncate'
}

export const mapTTSRecord = (record) => ({
  id: record.id,
  speaker: record.role || record.speaker || '',
  dubbing: record.speaker_audio_path || undefined,
  content: record.text || record.content || '',
  tone: record.emotion_text || record.tone || '',
  intensity: record.emotion_alpha || record.intensity || 0,
  delay: record.interval_silence || record.delay || 0,
  truncate: record.audio_end_truncate || 0,
  output_wav_path: record.output_wav_path,
  locked: record.status == 'locked' ? true : false
})
export const mapStatus = (islock) => {
  return islock ? 'locked' : 'padding'
}

/**
 * Synthesize audio from text
 * @param {string} text - The text to synthesize (when called from App.jsx)
 * @param {string} speakerAudioPath - Path to the speaker audio file (when called from App.jsx)
 * @param {Object} ttsData - TTS data object with speaker, content, tone, intensity, delay (when called from TTSList.jsx)
 * @returns {Promise<Object>} - The API response containing the synthesized audio information
 */
export const synthesizeTTS = async (record, { signal } = {}) => {
  const payload = {
    id: record.id,
    text: record.content,
    role: record.speaker,
    speaker_audio_path: record.dubbing,
    emotion_text: record.tone || record.emotion || null,
    emotion_alpha: record.intensity || 0,
    interval_silence: record.delay || 0,
    audio_end_truncate: record.truncate || 0
  }

  // Filter out null or undefined values
  const filteredPayload = Object.fromEntries(Object.entries(payload).filter(([_, value]) => value !== null && value !== undefined))

  try {
    const response = await fetch(`${API_BASE_URL}/api/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(filteredPayload),
      signal
    })

    if (!response.ok) {
      throw new Error(`TTS API error! status: ${response.status}`)
    }
    const { code, ...more } = await response.json()
    if (code != 0) return Promise.reject('Error synthesizing TTS')

    return more
  } catch (error) {
    console.error('Error synthesizing TTS:', error)
    throw error
  }
}

/**
 * Fetch all audio files from the server
 * @returns {Promise<Array>} - List of audio file objects
 */
export const fetchAudioFiles = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/audio-files`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data.files || []
  } catch (error) {
    console.error('Error fetching audio files:', error)
    throw error
  }
}

/**
 * Delete an audio file from the server
 * @param {string} filePath - Path of the file to delete
 * @returns {Promise<Object>} - API response
 */
export const deleteAudioFile = async (filePath) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/delete-file`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ path: filePath })
    })

    if (!response.ok) {
      throw new Error(`Delete API error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    throw error
  }
}

/**
 * Check if a synthesized audio file already exists on the server
 * @param {Object} record - The TTS data record
 * @returns {Promise<Object>} - API response with `exists` and `outpath`
 */
export const checkTTSExists = async (record) => {
  const payload = {
    id: record.id,
    text: record.content,
    role: record.speaker,
    speaker_audio_path: record.dubbing,
    emotion_text: record.tone || record.emotion || null,
    emotion_alpha: record.intensity || 0,
    interval_silence: record.delay || 0
  }

  const filteredPayload = Object.fromEntries(Object.entries(payload).filter(([_, value]) => value !== null && value !== undefined))

  try {
    const response = await fetch(`${API_BASE_URL}/api/tts/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(filteredPayload)
    })

    if (!response.ok) {
      throw new Error(`TTS check API error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error checking TTS existence:', error)
    throw error
  }
}

/**
 * Remove special symbols from text while preserving punctuation
 * @param {string} text - The text to process
 * @returns {Promise<Object>} - API response with original and processed text
 */
export const removeSpecialSymbols = async (text) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/remove-special-symbols`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    })

    if (!response.ok) {
      throw new Error(`Remove special symbols API error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error removing special symbols:', error)
    throw error
  }
}

/**
 * Sanitize filenames in a directory by removing special characters
 * @param {string} directory - The directory path to sanitize
 * @returns {Promise<Object>} - API response with status message
 */
export const sanitizeFilenames = async (directory) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sanitize-filenames`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ directory })
    })

    if (!response.ok) {
      throw new Error(`Sanitize filenames API error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error sanitizing filenames:', error)
    throw error
  }
}

/**
 * Save TTS template data to the database
 * @param {Array} jsonData - Array of TTS record objects
 * @returns {Promise<Object>} - API response with status message
 */
export const ttsTplSave = async (jsonData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/tts-tpl`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(jsonData)
    })

    if (!response.ok) {
      throw new Error(`TTS template save API error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error saving TTS template data:', error)
    throw error
  }
}

/**
 * Fetch TTS template records from the database with optional filters
 * @param {Object} filters - Optional filters for book_id, section_id, no
 * @param {number} page - Page number for pagination (default 1)
 * @param {number} pageSize - Page size for pagination (default 20, max 100)
 * @returns {Promise<Object>} - API response with TTS records list and total count
 */
export const ttsTplList = async (filters = {}) => {
  const { book_id, section_id, no, page = 1, page_size = 1000 } = filters

  // Build query parameters
  const params = new URLSearchParams()
  if (book_id !== undefined && book_id !== null) params.append('book_id', book_id)
  if (section_id !== undefined && section_id !== null) params.append('section_id', section_id)
  if (no !== undefined && no !== null) params.append('no', no)
  params.append('page', page)
  params.append('size', page_size)

  try {
    const response = await fetch(`${API_BASE_URL}/api/tts-tpl?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`TTS template list API error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching TTS template list:', error)
    throw error
  }
}

/**
 * Bulk delete TTS template records by book_id and section_id
 * @param {number} book_id - Book ID to filter records for deletion
 * @param {number} section_id - Section ID to filter records for deletion
 * @returns {Promise<Object>} - API response with deletion status
 */
export const ttsTplBulkDelete = async (book_id, section_id) => {
  const params = new URLSearchParams()
  params.append('book_id', book_id)
  params.append('section_id', section_id)

  try {
    const response = await fetch(`${API_BASE_URL}/api/tts-tpl?${params.toString()}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`TTS template bulk delete API error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error bulk deleting TTS template records:', error)
    throw error
  }
}

/**
 * Update a single TTS template record by ID
 * @param {number} id - Record ID to update
 * @param {Object} updates - Object containing fields to update
 * @returns {Promise<Object>} - API response with update status
 */
export const ttsTplUpdate = async (id, updates) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/tts-tpl/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    })

    if (!response.ok) {
      throw new Error(`TTS template update API error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error updating TTS template record:', error)
    throw error
  }
}

/**
 * Update a single TTS template record by ID
 * @param {number} id - Record ID to update
 * @param {Object} texts - Object containing fields to update
 * @returns {Promise<Object>} - API response with update status
 */
export const ttsTplSplit = async (id, texts) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/tts/split/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(texts)
    })

    if (!response.ok) {
      throw new Error(`TTS template update API error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error updating TTS template record:', error)
    throw error
  }
}

/**
 * Batch synthesize audio for all records in a book and section
 * @param {number} user_id - User ID (default 0)
 * @param {number} book_id - Book ID (default 0)
 * @param {number} section_id - Section ID (default 0)
 * @returns {Promise<Object>} - API response with batch synthesis status
 */
export const batchSynthesize = async (user_id = 0, book_id = 0, section_id = 0) => {
  const payload = {
    user_id,
    book_id,
    section_id
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/audio/joint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`Batch synthesis API error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error during batch synthesis:', error)
    throw error
  }
}

/**
 * Delete a single TTS template record by ID
 * @param {number} id - Record ID to delete
 * @returns {Promise<Object>} - API response with deletion status
 */
export const ttsTplDelete = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/tts-tpl/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`TTS template delete API error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error deleting TTS template record:', error)
    throw error
  }
}
