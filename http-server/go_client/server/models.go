package main

// FileItem represents a file or folder for the audio library API.
type FileItem struct {
	Name string `json:"name"` // Name in "folder/file" format
	Path string `json:"path"` // Full path of the audio file
	URL  string `json:"url"`  // URL for accessing the audio file via the API
}

// TTSRequest holds parameters for a text-to-speech synthesis request.
type TTSRequest struct {
	Text             string  `json:"text" binding:"required"`
	SpeakerAudioPath string  `json:"speaker_audio_path" binding:"required"`
	OutputWavPath    string  `json:"output_wav_path"`
	EmotionText      string  `json:"emotion_text,omitempty"`
	EmotionAlpha     float64 `json:"emotion_alpha,omitempty"`
	IntervalSilence  int     `json:"interval_silence,omitempty"`
	Role             string  `json:"role,omitempty"`
}

type DeleteFileRequest struct {
	Path string `json:"path" binding:"required"`
}
