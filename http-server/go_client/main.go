package main

import (
	"bytes"
	"fmt"
	"io"
	"math/rand"
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

	// --- New output path generation ---
	outputDir := "output/"
	if _, err := os.Stat(outputDir); os.IsNotExist(err) {
		os.Mkdir(outputDir, 0755)
	}

	speakerBase := strings.TrimSuffix(filepath.Base(ttsReq.SpeakerAudioPath), filepath.Ext(ttsReq.SpeakerAudioPath))
	rand.Seed(time.Now().UnixNano())
	randomInt := rand.Intn(100000)
	newFileName := fmt.Sprintf("%s_%d.wav", speakerBase, randomInt)
	ttsReq.OutputWavPath = filepath.Join(outputDir, newFileName)
	// --- End of new output path generation ---

	externalApiURL := "http://127.0.0.1:8800/inference"

	if err := synthesizeSpeech(externalApiURL, ttsReq); err != nil {
		fmt.Fprintf(os.Stderr, "TTS Synthesis Error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to synthesize speech: " + err.Error()})
		return
	}

	// After success, create a FileItem for the new file to return to the client.
	absPath, err := filepath.Abs(ttsReq.OutputWavPath)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to get absolute path: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not construct file path for response"})
		return
	}

	newFile := FileItem{
		Name: filepath.ToSlash(ttsReq.OutputWavPath),
		Path: absPath,
		URL:  "/api/audio-file/" + filepath.ToSlash(ttsReq.OutputWavPath),
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"newFile": newFile,
	})
}

func audioFilesHandler(c *gin.Context) {
	rootPaths := []string{
		"/home/zdz/Documents/Try/TTS/audio/audiobook_manager/wav",
		"output",
	}

	var allFiles []FileItem
	for _, p := range rootPaths {
		fileList, err := ReadDirectoryRecursive(p)
		if err != nil {
			// Decide if you want to fail entirely or just log the error and continue
			fmt.Fprintf(os.Stderr, "Error reading directory %s: %v\n", p, err)
			continue
		}
		allFiles = append(allFiles, fileList...)
	}

	c.JSON(http.StatusOK, gin.H{
		"files": allFiles,
		"count": len(allFiles),
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

	// Determine the correct base path. This is a security risk if not handled carefully.
	// For this example, we'll check which directory the file belongs to.
	// A more robust solution might involve a map or a more secure way of resolving paths.
	var fullPath string
	if strings.HasPrefix(filePath, "output/") {
		cwd, _ := os.Getwd()
		fullPath = filepath.Join(cwd, filePath)
	} else {
		fullPath = filepath.Join("/home/zdz/Documents/Try/TTS/audio/audiobook_manager/wav", filePath)
	}

	if _, err := os.Stat(fullPath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		return
	}

	c.File(fullPath)
}

type DeleteFileRequest struct {
	Path string `json:"path" binding:"required"`
}

func deleteAudioFileHandler(c *gin.Context) {
	var req DeleteFileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body: " + err.Error()})
		return
	}

	// Security check: only allow deleting files from the 'output' directory
	if !strings.HasPrefix(req.Path, "output/") {
		c.JSON(http.StatusForbidden, gin.H{"error": "Permission denied: can only delete files from the output directory"})
		return
	}

	// Sanitize the path to prevent directory traversal
	cleanPath := filepath.Clean(req.Path)
	if strings.Contains(cleanPath, "..") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file path"})
		return
	}

	if err := os.Remove(cleanPath); err != nil {
		fmt.Fprintf(os.Stderr, "Error deleting file %s: %v\n", cleanPath, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete file"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "File deleted successfully"})
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

		// The Name for the UI should be prefixed if it's from the output directory.
		uiName := filepath.ToSlash(relPath)
		if filepath.Base(rootPath) == "output" {
			uiName = "output/" + uiName
		}

		absPath, err := filepath.Abs(path)
		if err != nil {
			return err
		}

		fileItem := FileItem{
			Name: uiName,
			Path: absPath,
			URL:  "/api/audio-file/" + uiName,
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
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE")
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
		api.DELETE("/delete-file", deleteAudioFileHandler)
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

