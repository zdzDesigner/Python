package main

import (
	"bytes"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// --- Struct Definitions ---

// FileItem represents a file or folder for the audio library API.
type FileItem struct {
	Name string `json:"Name"` // Name in "folder/file" format
	Path string `json:"Path"` // Full path of the audio file
	URL  string `json:"URL"`  // URL for accessing the audio file via the API
}

// TTSRequest holds parameters for a text-to-speech synthesis request.
type TTSRequest struct {
	Text             string  `json:"text" binding:"required"`
	SpeakerAudioPath string  `json:"speaker_audio_path" binding:"required"`
	OutputWavPath    string  `json:"output_wav_path" binding:"required"`
	EmotionText      string  `json:"emotion_text,omitempty"`
	EmotionAlpha     float64 `json:"emotion_alpha,omitempty"`
	IntervalSilence  int     `json:"interval_silence,omitempty"`
}

// --- TTS Synthesis Logic (unchanged) ---

func synthesizeSpeech(apiURL string, request TTSRequest) error {
	var requestBody bytes.Buffer
	writer := multipart.NewWriter(&requestBody)

	if err := writer.WriteField("text", request.Text); err != nil {
		return fmt.Errorf("failed to add 'text' field: %w", err)
	}
	if err := writer.WriteField("use_emo_text", "true"); err != nil {
		return fmt.Errorf("failed to add 'use_emo_text' field: %w", err)
	}
	if request.EmotionText != "" {
		if err := writer.WriteField("emo_text", request.EmotionText); err != nil {
			return fmt.Errorf("failed to add 'emo_text' field: %w", err)
		}
	}
	if request.EmotionAlpha > 0 {
		if err := writer.WriteField("emo_alpha", fmt.Sprintf("%.2f", request.EmotionAlpha)); err != nil {
			return fmt.Errorf("failed to add 'emo_alpha' field: %w", err)
		}
	}
	if request.IntervalSilence > 0 {
		if err := writer.WriteField("interval_silence", fmt.Sprintf("%d", request.IntervalSilence)); err != nil {
			return fmt.Errorf("failed to add 'interval_silence' field: %w", err)
		}
	}

	file, err := os.Open(request.SpeakerAudioPath)
	if err != nil {
		return fmt.Errorf("could not open reference audio file '%s': %w", request.SpeakerAudioPath, err)
	}
	defer file.Close()

	part, err := writer.CreateFormFile("spk_audio_prompt", filepath.Base(request.SpeakerAudioPath))
	if err != nil {
		return fmt.Errorf("failed to create form file: %w", err)
	}
	if _, err = io.Copy(part, file); err != nil {
		return fmt.Errorf("failed to copy file content to request: %w", err)
	}

	if err = writer.Close(); err != nil {
		return fmt.Errorf("failed to close multipart writer: %w", err)
	}

	req, err := http.NewRequest("POST", apiURL, &requestBody)
	if err != nil {
		return fmt.Errorf("failed to create HTTP request: %w", err)
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{Timeout: time.Second * 120}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send HTTP request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		errorBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("external TTS API returned non-200 status code %d: %s", resp.StatusCode, string(errorBody))
	}

	outputFile, err := os.Create(request.OutputWavPath)
	if err != nil {
		return fmt.Errorf("failed to create output file '%s': %w", request.OutputWavPath, err)
	}
	defer outputFile.Close()

	if _, err = io.Copy(outputFile, resp.Body); err != nil {
		return fmt.Errorf("failed to write audio data to file: %w", err)
	}

	return nil
}

// --- Gin Handlers ---

func ttsHandler(c *gin.Context) {
	var ttsReq TTSRequest
	if err := c.ShouldBindJSON(&ttsReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body: " + err.Error()})
		return
	}

	fmt.Printf("Received TTS request: %+v\n", ttsReq)

	externalApiURL := "http://127.0.0.1:8800/inference"

	if err := synthesizeSpeech(externalApiURL, ttsReq); err != nil {
		fmt.Fprintf(os.Stderr, "TTS Synthesis Error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to synthesize speech: " + err.Error()})
		return
	}

	// After success, create a FileItem for the new file to return to the client.
	audioRootPath := "/home/zdz/Documents/Try/TTS/audio/audiobook_manager/wav"
	relPath, err := filepath.Rel(audioRootPath, ttsReq.OutputWavPath)
	if err != nil {
		// This should ideally not happen if paths are correct, but handle it.
		fmt.Fprintf(os.Stderr, "Error creating relative path: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not construct file path for response"})
		return
	}

	newFile := FileItem{
		Name: filepath.ToSlash(relPath),
		Path: ttsReq.OutputWavPath,
		URL:  "/api/audio-file/" + filepath.ToSlash(relPath),
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"newFile": newFile,
	})
}

func audioFilesHandler(c *gin.Context) {
	rootPath := "/home/zdz/Documents/Try/TTS/audio/audiobook_manager/wav"
	fileList, err := ReadDirectoryRecursive(rootPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"files": fileList,
		"count": len(fileList),
	})
}

func audioFileHandler(c *gin.Context) {
	filePath := c.Param("path")
	// The path parameter from Gin includes the leading '/', so we trim it.
	filePath = strings.TrimPrefix(filePath, "/")

	if strings.Contains(filePath, "../") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file path"})
		return
	}

	fullPath := filepath.Join("/home/zdz/Documents/Try/TTS/audio/audiobook_manager/wav", filePath)
	if _, err := os.Stat(fullPath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		return
	}

	c.File(fullPath)
}

// --- Directory Reading Logic (unchanged) ---

func ReadDirectoryRecursive(rootPath string) ([]FileItem, error) {
	var fileList []FileItem
	err := filepath.Walk(rootPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			return nil
		}

		ext := strings.ToLower(filepath.Ext(path))
		isAudioFile := false
		switch ext {
		case ".mp3", ".wav", ".ogg", ".flac", ".aac", ".m4a", ".wma", ".opus":
			isAudioFile = true
		}
		if !isAudioFile {
			return nil
		}

		relPath, err := filepath.Rel(rootPath, path)
		if err != nil {
			return err
		}
		if relPath == "." {
			return nil
		}

		relPath = filepath.ToSlash(relPath)
		fileItem := FileItem{
			Name: relPath,
			Path: path,
			URL:  "/api/audio-file/" + relPath,
		}
		fileList = append(fileList, fileItem)
		return nil
	})
	if err != nil {
		return nil, err
	}
	return fileList, nil
}

// --- Middleware ---

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

// --- Main Application Entry Point ---

func main() {
	gin.SetMode(gin.ReleaseMode)
	router := gin.New() // Create a new router without default middleware

	// Add custom logger and recovery middleware
	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	// Add CORS middleware
	router.Use(corsMiddleware())

	// Group API routes
	api := router.Group("/api")
	{
		api.GET("/audio-files", audioFilesHandler)
		api.GET("/audio-file/*path", audioFileHandler)
		api.POST("/tts", ttsHandler)
	}

	// Health check route
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	port := "8081"
	fmt.Printf("Gin server starting on http://localhost:%s\n", port)
	err := router.Run(":" + port)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Server error: %v\n", err)
		os.Exit(1)
	}
}
