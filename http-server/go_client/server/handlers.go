package main

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"go-audio-server/db"
	"go-audio-server/db/sqlite"
	"go-audio-server/internal/ginc"

	"github.com/gin-gonic/gin"
)

func ttsHandler(ctx ginc.Contexter) {
	var ttsReq TTSRequest
	if err := ctx.ParseReqbody(&ttsReq); err != nil {
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

	externalApiURL := "http://127.0.0.1:8800/inference"

	if err := synthesizeSpeech(externalApiURL, ttsReq); err != nil {
		fmt.Fprintf(os.Stderr, "TTS Synthesis Error: %v\n", err)
		ctx.FailErr(500, "Failed to synthesize speech: "+err.Error())
		return
	}

	absPath, err := filepath.Abs(ttsReq.OutputWavPath)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to get absolute path: %v\n", err)
		ctx.FailErr(500, "Could not construct file path for response")
		return
	}

	newFile := FileItem{
		Name: filepath.ToSlash(ttsReq.OutputWavPath),
		Path: absPath,
		URL:  "/api/audio-file/" + filepath.ToSlash(ttsReq.OutputWavPath),
	}

	ctx.Success(gin.H{
		"status":  "success",
		"newFile": newFile,
	})
}

func checkTTSExistsHandler(ctx ginc.Contexter) {
	var ttsReq TTSRequest
	if err := ctx.ParseReqbody(&ttsReq); err != nil {
		return
	}

	outputDir := "output/"
	fileName := GenerateTTSFilename(ttsReq)
	filePath := filepath.Join(outputDir, fileName)
	fmt.Println(filePath)

	if _, err := os.Stat(filePath); err == nil {
		// File exists
		ctx.Success(gin.H{
			"exists":  true,
			"outpath": filepath.ToSlash(filePath),
		})
	} else {
		// File does not exist
		ctx.Success(gin.H{
			"exists":  false,
			"outpath": "",
		})
	}
}

func audioFilesHandler(ctx ginc.Contexter) {
	// c := ctx.GinCtx()
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

	ctx.Success(gin.H{
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

func deleteAudioFileHandler(ctx ginc.Contexter) {
	var req DeleteFileRequest
	if err := ctx.ParseReqbody(&req); err != nil {
		return
	}

	// Security check: only allow deleting files from the 'output' directory
	if !strings.HasPrefix(req.Path, "output/") {
		ctx.FailErr(403, "Permission denied: can only delete files from the output directory")
		return
	}

	// Sanitize the path to prevent directory traversal
	cleanPath := filepath.Clean(req.Path)
	if strings.Contains(cleanPath, "..") {
		ctx.FailErr(400, "Invalid file path")
		return
	}

	if err := os.Remove(cleanPath); err != nil {
		fmt.Fprintf(os.Stderr, "Error deleting file %s: %v\n", cleanPath, err)
		ctx.FailErr(500, "Failed to delete file")
		return
	}

	ctx.Success(gin.H{
		"status":  "success",
		"message": "File deleted successfully",
	})
}

func removeSpecialSymbolsHandler(ctx ginc.Contexter) {
	var req struct {
		Text string `json:"text" binding:"required"`
	}

	if err := ctx.ParseReqbody(&req); err != nil {
		return
	}

	processedText := RemoveSpecialSymbols(req.Text)

	ctx.Success(gin.H{
		"original_text":  req.Text,
		"processed_text": processedText,
	})
}

func sanitizeFilenamesHandler(ctx ginc.Contexter) {
	var req struct {
		Directory string `json:"directory" binding:"required"`
	}

	if err := ctx.ParseReqbody(&req); err != nil {
		return
	}

	if err := SanitizeFilenames(req.Directory); err != nil {
		ctx.FailErr(500, "Failed to sanitize filenames: "+err.Error())
		return
	}

	ctx.Success(gin.H{
		"status":    "success",
		"message":   "Filenames sanitized successfully",
		"directory": req.Directory,
	})
}

func ttsTplHandler(ctx ginc.Contexter) {
	var jsonData []map[string]interface{}
	if err := ctx.ParseReqbody(&jsonData); err != nil {
		return
	}

	// Process each item in the JSON array
	for i, item := range jsonData {
		// Create a TTS record from the JSON data
		ttsRecord := &db.TTSRecord{
			Role:             getStringValue(item, "speaker", ""),
			Text:             getStringValue(item, "content", ""),
			EmotionText:      getStringValue(item, "tone", ""),
			EmotionAlpha:     int(item["intensity"].(float64)),
			IntervalSilence:  int(item["delay"].(float64)),
			SpeakerAudioPath: getStringValue(item, "speaker_audio_path", ""),
			OutputWavPath:    getStringValue(item, "output_wav_path", ""),
			UserID:           0,
			BookId:           0,
			SectionId:        0,
			No:               i * 10,
			Status:           "pending", // Default status
		}

		// Add the record to the database
		if err := ttsRecord.Add(); err != nil {
			fmt.Fprintf(os.Stderr, "Failed to add TTS record to database: %v\n", err)
			ctx.FailErr(500, "Failed to store TTS record: "+err.Error())
			return
		}
	}

	ctx.Success(gin.H{
		"status":  "success",
		"message": fmt.Sprintf("Stored %d TTS records", len(jsonData)),
		"count":   len(jsonData),
	})
}

// ttsTplList lists TTS records with optional filtering by book_id, section_id, and no
func ttsTplList(ctx ginc.Contexter) {
	section_id := ctx.Query("section_id")
	book_id := ctx.Query("section_id")
	no := ctx.Query("no")
	page := ctx.Query("page")
	size := ctx.Query("size")

	querys := make(map[string]any, 3)
	if book_id != "" {
		querys["book_id"] = book_id
	}
	if section_id != "" {
		querys["section_id"] = section_id
	}
	if no != "" {
		querys["no"] = no
	}
	// Create a TTSRecord instance to use the model methods
	record := &db.TTSRecord{}
	// Get records with pagination
	list, err := record.GetFunc(func(s *sqlite.Sql) *sqlite.Sql {
		return s.Where(querys).Limit(sqlite.ToLimit(page, size)).Order("no asc")
	})
	if err != nil {
		ctx.FailErr(40100, err.Error())
		return
	}

	// Get total count for pagination info
	total := record.Count()

	ctx.Success(gin.H{
		"list":  list,
		"total": total,
	})
}

// Helper function to safely extract string values from interface{}
func getStringValue(m map[string]interface{}, key string, defaultValue string) string {
	if val, ok := m[key]; ok {
		if str, ok := val.(string); ok {
			return str
		}
	}
	return defaultValue
}
