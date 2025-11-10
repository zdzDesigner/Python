package main

import (
	"fmt"
	"math/rand"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

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
