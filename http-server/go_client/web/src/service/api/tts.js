/**
 * TTS (Text-to-Speech) API Service
 * Handles communication with the backend TTS API
 */

const API_BASE_URL = 'http://localhost:8081'

/**
 * Synthesize audio from text
 * @param {string} text - The text to synthesize
 * @param {string} speakerAudioPath - Path to the speaker audio file
 * @returns {Promise<Object>} - The API response containing the synthesized audio information
 */
export const synthesizeTTS = async (text, speakerAudioPath = null) => {
  const requestBody = {
    text: text,
    speaker_audio_path: speakerAudioPath,
    output_wav_path: '', // The backend will generate the path
    emotion_text: 'default',
    emotion_alpha: 0.7,
    interval_silence: 500
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/tts`, {
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
    return result
  } catch (error) {
    console.error('Error synthesizing audio:', error)
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
    console.error('Error deleting file:', error)
    throw error
  }
}