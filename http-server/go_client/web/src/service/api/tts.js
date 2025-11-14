/**
 * TTS (Text-to-Speech) API Service
 * Handles communication with the backend TTS API
 */

const API_BASE_URL = 'http://localhost:8081'

/**
 * Synthesize audio from text
 * @param {string} text - The text to synthesize (when called from App.jsx)
 * @param {string} speakerAudioPath - Path to the speaker audio file (when called from App.jsx)
 * @param {Object} ttsData - TTS data object with speaker, content, tone, intensity, delay (when called from TTSList.jsx)
 * @returns {Promise<Object>} - The API response containing the synthesized audio information
 */
export const synthesizeTTS = async (record) => {
  const payload = {
    text: record.content,
    role: record.speaker,
    speaker_audio_path: record.dubbing,
    emotion_text: record.tone || record.emotion || null,
    emotion_alpha: record.intensity || 0,
    interval_silence: record.delay || 0
  }

  // Filter out null or undefined values
  const filteredPayload = Object.fromEntries(Object.entries(payload).filter(([_, value]) => value !== null && value !== undefined))

  try {
    const response = await fetch(`${API_BASE_URL}/api/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(filteredPayload)
    })

    if (!response.ok) {
      throw new Error(`TTS API error! status: ${response.status}`)
    }

    return await response.json()
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
