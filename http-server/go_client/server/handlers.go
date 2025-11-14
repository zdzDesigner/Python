package main

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
)

func ttsHandler(c *gin.Context) {
	var ttsReq TTSRequest
	if err := c.ShouldBindJSON(&ttsReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body: " + err.Error()})
		return
	}

	fmt.Printf("Received TTS request: %+v\n", ttsReq)

	outputDir := "output/"
	if _, err := os.Stat(outputDir); os.IsNotExist(err) {
		os.Mkdir(outputDir, 0o755)
	}

	// Use the centralized function to generate the filename
	newFileName := GenerateTTSFilename(ttsReq)
	ttsReq.OutputWavPath = filepath.Join(outputDir, newFileName)

	// Check if the file already exists to avoid duplicate processing(not check)
	// if _, err := os.Stat(ttsReq.OutputWavPath); err == nil {
	// 	fmt.Printf("File already exists: %s, returning existing file\n", ttsReq.OutputWavPath)
	// 	absPath, err := filepath.Abs(ttsReq.OutputWavPath)
	// 	if err != nil {
	// 		fmt.Fprintf(os.Stderr, "Failed to get absolute path: %v\n", err)
	// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not construct file path for response"})
	// 		return
	// 	}
	//
	// 	existingFile := FileItem{
	// 		Name: filepath.ToSlash(ttsReq.OutputWavPath),
	// 		Path: absPath,
	// 		URL:  "/api/audio-file/" + filepath.ToSlash(ttsReq.OutputWavPath),
	// 	}
	//
	// 	c.JSON(http.StatusOK, gin.H{
	// 		"status":  "success",
	// 		"newFile": existingFile,
	// 	})
	// 	return
	// }

	externalApiURL := "http://127.0.0.1:8800/inference"

	if err := synthesizeSpeech(externalApiURL, ttsReq); err != nil {
		fmt.Fprintf(os.Stderr, "TTS Synthesis Error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to synthesize speech: " + err.Error()})
		return
	}

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

func checkTTSExistsHandler(c *gin.Context) {
	var ttsReq TTSRequest
	if err := c.ShouldBindJSON(&ttsReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body: " + err.Error()})
		return
	}

	outputDir := "output/"
	fileName := GenerateTTSFilename(ttsReq)
	filePath := filepath.Join(outputDir, fileName)
	fmt.Println(filePath)

	if _, err := os.Stat(filePath); err == nil {
		// File exists
		c.JSON(http.StatusOK, gin.H{
			"exists":  true,
			"outpath": filepath.ToSlash(filePath),
		})
	} else {
		// File does not exist
		c.JSON(http.StatusOK, gin.H{
			"exists":  false,
			"outpath": "",
		})
	}
}

func audioFilesHandler(c *gin.Context) {
	rootPaths := []string{
		GetAudioPath(),
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
		fullPath = filepath.Join(GetAudioPath(), filePath)
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

func removeSpecialSymbolsHandler(c *gin.Context) {
	var req struct {
		Text string `json:"text" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body: " + err.Error()})
		return
	}

	// _, err := ReadDirectoryRecursivClearUp(req.Text)
	// if err != nil {
	// 	c.JSON(http.StatusNotExtended, gin.H{
	// 		"original_text": req.Text,
	// 	})
	// 	return
	// }

	c.JSON(http.StatusOK, gin.H{
		"original_text": req.Text,
	})
}

func sanitizeFilenamesHandler(c *gin.Context) {
	var req struct {
		Directory string `json:"directory" binding:"required"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body: " + err.Error()})
		return
	}

	if err := SanitizeFilenames(req.Directory); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to sanitize filenames: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"message": "Filenames sanitized successfully",
		"directory": req.Directory,
	})
}
