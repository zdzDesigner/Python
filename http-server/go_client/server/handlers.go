package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"go-audio-server/db"
	"go-audio-server/db/sqlite"
	"go-audio-server/internal/ginc"

	"github.com/gin-gonic/gin"
)

var OUTPUT_DIR = "output/"

// Helper function to save uploaded file
func saveUploadedFile(c *gin.Context, formKey string, uploadDir string) (string, error) {
	file, err := c.FormFile(formKey)
	if err != nil {
		return "", err
	}

	// Create upload directory if it doesn't exist
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		return "", err
	}

	// Generate unique filename
	ext := filepath.Ext(file.Filename)
	filename := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)
	filePath := filepath.Join(uploadDir, filename)

	// Save file
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		return "", err
	}

	// Return relative path
	return filepath.Join("uploads", filename), nil
}

// Books handlers
func booksHandler(ctx ginc.Contexter) {
	c := ctx.GinCtx()

	// Parse multipart form
	err := c.Request.ParseMultipartForm(32 << 20) // 32MB max memory
	if err != nil {
		// If parsing multipart form fails, try to parse JSON
		var bookReq db.Book
		if err := ctx.ParseReqbody(&bookReq); err != nil {
			return
		}

		// Add the new book to the database
		ret, err := bookReq.Add()
		if err != nil {
			ctx.FailErr(500, "Failed to add book: "+err.Error())
			return
		}

		ctx.Success(gin.H{
			"status": "success",
			"data":   gin.H{"id": ret.Id},
		})
		return
	}

	// Create new book instance
	book := &db.Book{}

	// Get form values
	book.Name = c.PostForm("name")
	book.Description = c.PostForm("describe")
	book.Bg = c.PostForm("bg")

	// Parse size
	if sizeStr := c.PostForm("size"); sizeStr != "" {
		if size, err := strconv.Atoi(sizeStr); err == nil {
			book.Size = size
		}
	}

	// Handle cover file upload
	uploadDir := filepath.Join("assets", "uploads")

	// Handle cover upload
	if _, err := c.FormFile("cover_file"); err == nil {
		if coverPath, err := saveUploadedFile(c, "cover_file", uploadDir); err == nil {
			book.Bg = coverPath
		}
	}

	// Validate required fields
	if book.Name == "" {
		ctx.FailErr(400, "Name is required")
		return
	}

	// Add the new book to the database
	ret, err := book.Add()
	if err != nil {
		ctx.FailErr(500, "Failed to add book: "+err.Error())
		return
	}

	ctx.Success(gin.H{
		"status": "success",
		"data":   gin.H{"id": ret.Id},
	})
}

func booksListHandler(ctx ginc.Contexter) {
	// Extract query parameters for filtering
	name := ctx.GinCtx().Query("name")
	pageStr := ctx.GinCtx().Query("page")
	pageSizeStr := ctx.GinCtx().Query("size")

	filters := make(map[string]interface{})

	if name != "" {
		filters["name"] = name
	}

	// Parse pagination parameters
	page := 1
	pageSize := 20

	if pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}

	if pageSizeStr != "" {
		if ps, err := strconv.Atoi(pageSizeStr); err == nil && ps > 0 {
			if ps > 100 { // Limit maximum page size
				ps = 100
			}
			pageSize = ps
		}
	}

	// Calculate offset for pagination
	offset := (page - 1) * pageSize
	limit := []string{strconv.Itoa(offset), strconv.Itoa(pageSize)}

	var book db.Book
	var books []*db.Book
	var err error

	if len(filters) > 0 {
		books, err = book.Get(filters, limit, false)
	} else {
		books, err = book.Get(nil, limit, false)
	}

	if err != nil {
		ctx.FailErr(500, "Failed to fetch books: "+err.Error())
		return
	}

	// Get total count for pagination info
	total := book.Count()

	ctx.Success(gin.H{
		"status":   "success",
		"data":     books,
		"total":    total,
		"page":     page,
		"size":     pageSize,
		"has_next": total > (page * pageSize),
	})
}

func booksUpdateHandler(ctx ginc.Contexter) {
	idStr := ctx.GinCtx().Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		ctx.FailErr(400, "Invalid book ID")
		return
	}

	var updates map[string]interface{}
	if err := ctx.ParseReqbody(&updates); err != nil {
		return
	}

	// Update the book with provided fields by creating a new book instance
	updatedBook := &db.Book{ID: id}

	// Update fields based on the provided updates map
	for key, value := range updates {
		switch key {
		case "name":
			if val, ok := value.(string); ok {
				updatedBook.Name = val
			}
		case "describe":
			if val, ok := value.(string); ok {
				updatedBook.Description = val
			}
		case "bg":
			if val, ok := value.(string); ok {
				updatedBook.Bg = val
			}
		case "size":
			if val, ok := value.(float64); ok {
				updatedBook.Size = int(val)
			}
		}
	}

	// Get all field names to update
	keys := make([]string, 0, len(updates))
	for key := range updates {
		keys = append(keys, key)
	}

	// Update the book record
	if err := updatedBook.UpdateByID(id, keys...); err != nil {
		ctx.FailErr(500, "Failed to update book: "+err.Error())
		return
	}

	ctx.Success(gin.H{
		"status": "success",
		"msg":    "Book updated successfully",
		"data":   gin.H{"id": id},
	})
}

func booksDeleteHandler(ctx ginc.Contexter) {
	idStr := ctx.GinCtx().Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		ctx.FailErr(400, "Invalid book ID")
		return
	}

	var book db.Book
	err = book.Del(map[string]any{"id": id})
	if err != nil {
		ctx.FailErr(500, "Failed to delete book: "+err.Error())
		return
	}

	ctx.Success(gin.H{
		"status": "success",
		"msg":    "Book deleted successfully",
	})
}

// Dubbings handlers
// Dubbings handlers
func dubbingsHandler(ctx ginc.Contexter) {
	c := ctx.GinCtx()

	// Parse multipart form
	err := c.Request.ParseMultipartForm(32 << 20) // 32MB max memory
	if err != nil {
		ctx.FailErr(400, "Failed to parse form: "+err.Error())
		return
	}

	// Create new dubbing instance
	dubbing := &db.Dubbing{}

	// Get form values
	dubbing.Name = c.PostForm("name")
	dubbing.AgeText = c.PostForm("age_text")
	dubbing.EmotionText = c.PostForm("emotion_text")
	dubbing.Avatar = c.PostForm("avatar")
	dubbing.WavPath = c.PostForm("wav_path")

	// Handle file uploads
	uploadDir := filepath.Join("assets", "uploads")

	// Handle avatar upload
	if _, err := c.FormFile("avatar_file"); err == nil {
		if avatarPath, err := saveUploadedFile(c, "avatar_file", uploadDir); err == nil {
			dubbing.Avatar = avatarPath
		}
	}

	// Handle wav file upload
	if _, err := c.FormFile("wav_file"); err == nil {
		if wavPath, err := saveUploadedFile(c, "wav_file", uploadDir); err == nil {
			dubbing.WavPath = wavPath
		}
	}

	// Validate required fields
	if dubbing.Name == "" {
		ctx.FailErr(400, "Name is required")
		return
	}

	// Add the new dubbing to the database
	ret, err := dubbing.Add()
	if err != nil {
		ctx.FailErr(500, "Failed to add dubbing: "+err.Error())
		return
	}

	ctx.Success(gin.H{
		"status": "success",
		"data":   gin.H{"id": ret.Id},
	})
}

func dubbingsListHandler(ctx ginc.Contexter) {
	// Extract query parameters for filtering
	name := ctx.GinCtx().Query("name")
	pageStr := ctx.GinCtx().Query("page")
	pageSizeStr := ctx.GinCtx().Query("size")

	filters := make(map[string]interface{})

	if name != "" {
		filters["name"] = name
	}

	// Pagination
	page := 1
	pageSize := 20
	if pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}
	if pageSizeStr != "" {
		if ps, err := strconv.Atoi(pageSizeStr); err == nil && ps > 0 && ps <= 100 {
			pageSize = ps
		}
	}

	// Calculate offset
	offset := (page - 1) * pageSize
	limit := []string{strconv.Itoa(offset), strconv.Itoa(pageSize)}

	var dubbing db.Dubbing
	var dubbings []*db.Dubbing
	var err error

	if len(filters) > 0 {
		dubbings, err = dubbing.Get(filters, limit, false)
	} else {
		dubbings, err = dubbing.Get(nil, limit, false)
	}

	if err != nil {
		ctx.FailErr(500, "Failed to fetch dubbings: "+err.Error())
		return
	}

	// Get total count for pagination info
	total := dubbing.Count()

	ctx.Success(gin.H{
		"status":   "success",
		"data":     dubbings,
		"total":    total,
		"page":     page,
		"size":     pageSize,
		"has_next": total > (page * pageSize),
	})
}

func dubbingsUpdateHandler(ctx ginc.Contexter) {
	idStr := ctx.GinCtx().Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		ctx.FailErr(400, "Invalid dubbing ID")
		return
	}

	c := ctx.GinCtx()

	// Parse multipart form
	err = c.Request.ParseMultipartForm(32 << 20) // 32MB max memory
	if err != nil {
		// If parsing multipart form fails, try to parse JSON
		var updates map[string]interface{}
		if err := ctx.ParseReqbody(&updates); err != nil {
			return
		}

		// Update the dubbing with provided fields by creating a new dubbing instance
		updatedDubbing := &db.Dubbing{ID: id}

		// Update fields based on the provided updates map
		for key, value := range updates {
			switch key {
			case "name":
				if val, ok := value.(string); ok {
					updatedDubbing.Name = val
				}
			case "avatar":
				if val, ok := value.(string); ok {
					updatedDubbing.Avatar = val
				}
			case "age_text":
				if val, ok := value.(string); ok {
					updatedDubbing.AgeText = val
				}
			case "emotion_text":
				if val, ok := value.(string); ok {
					updatedDubbing.EmotionText = val
				}
			case "wav_path":
				if val, ok := value.(string); ok {
					updatedDubbing.WavPath = val
				}
			}
		}

		// Get all field names to update
		keys := make([]string, 0, len(updates))
		for key := range updates {
			keys = append(keys, key)
		}

		// Update the dubbing record
		if err := updatedDubbing.UpdateByID(id, keys...); err != nil {
			ctx.FailErr(500, "Failed to update dubbing: "+err.Error())
			return
		}

		ctx.Success(gin.H{
			"status": "success",
			"msg":    "Dubbing updated successfully",
			"data":   gin.H{"id": id},
		})
		return
	}

	// Handle multipart form update
	dubbing := &db.Dubbing{ID: id}

	// Get form values
	if name := c.PostForm("name"); name != "" {
		dubbing.Name = name
	}
	if ageText := c.PostForm("age_text"); ageText != "" {
		dubbing.AgeText = ageText
	}
	if emotionText := c.PostForm("emotion_text"); emotionText != "" {
		dubbing.EmotionText = emotionText
	}
	if avatar := c.PostForm("avatar"); avatar != "" {
		dubbing.Avatar = avatar
	}
	if wavPath := c.PostForm("wav_path"); wavPath != "" {
		dubbing.WavPath = wavPath
	}

	// Handle file uploads
	uploadDir := filepath.Join("assets", "uploads")

	// Handle avatar upload
	if _, err := c.FormFile("avatar_file"); err == nil {
		if avatarPath, err := saveUploadedFile(c, "avatar_file", uploadDir); err == nil {
			dubbing.Avatar = avatarPath
		}
	}

	// Handle wav file upload
	if _, err := c.FormFile("wav_file"); err == nil {
		if wavPath, err := saveUploadedFile(c, "wav_file", uploadDir); err == nil {
			dubbing.WavPath = wavPath
		}
	}

	// Get all non-empty fields to update
	keys := []string{}
	if dubbing.Name != "" {
		keys = append(keys, "name")
	}
	if dubbing.Avatar != "" {
		keys = append(keys, "avatar")
	}
	if dubbing.AgeText != "" {
		keys = append(keys, "age_text")
	}
	if dubbing.EmotionText != "" {
		keys = append(keys, "emotion_text")
	}
	if dubbing.WavPath != "" {
		keys = append(keys, "wav_path")
	}

	// Update the dubbing record
	if err := dubbing.UpdateByID(id, keys...); err != nil {
		ctx.FailErr(500, "Failed to update dubbing: "+err.Error())
		return
	}

	ctx.Success(gin.H{
		"status": "success",
		"msg":    "Dubbing updated successfully",
		"data":   gin.H{"id": id},
	})
}

func dubbingsDeleteHandler(ctx ginc.Contexter) {
	idStr := ctx.GinCtx().Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		ctx.FailErr(400, "Invalid dubbing ID")
		return
	}

	var dubbing db.Dubbing
	err = dubbing.Del(map[string]any{"id": id})
	if err != nil {
		ctx.FailErr(500, "Failed to delete dubbing: "+err.Error())
		return
	}

	ctx.Success(gin.H{
		"status": "success",
		"msg":    "Dubbing deleted successfully",
	})
}

func sectionsHandler(ctx ginc.Contexter) {
	var sectionReq db.Section
	if err := ctx.ParseReqbody(&sectionReq); err != nil {
		return
	}

	// Add the new section to the database
	ret, err := sectionReq.Add()
	if err != nil {
		ctx.FailErr(500, "Failed to add section: "+err.Error())
		return
	}

	ctx.Success(gin.H{
		"status": "success",
		"data":   gin.H{"id": ret.Id},
	})
}

func sectionsListHandler(ctx ginc.Contexter) {
	// Extract query parameters for filtering
	bookIDStr := ctx.GinCtx().Query("book_id")
	name := ctx.GinCtx().Query("name")
	pageStr := ctx.GinCtx().Query("page")
	pageSizeStr := ctx.GinCtx().Query("size")

	filters := make(map[string]interface{})

	if bookIDStr != "" {
		if bookID, err := strconv.Atoi(bookIDStr); err == nil {
			filters["book_id"] = bookID
		}
	}

	if name != "" {
		filters["name"] = name
	}

	// Parse pagination parameters
	page := 1
	pageSize := 20

	if pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}

	if pageSizeStr != "" {
		if ps, err := strconv.Atoi(pageSizeStr); err == nil && ps > 0 {
			if ps > 100 { // Limit maximum page size
				ps = 100
			}
			pageSize = ps
		}
	}

	// Calculate offset for pagination
	offset := (page - 1) * pageSize
	limit := []string{strconv.Itoa(offset), strconv.Itoa(pageSize)}

	var section db.Section
	var sections []*db.Section
	var err error

	if len(filters) > 0 {
		sections, err = section.Get(filters, limit, false)
	} else {
		sections, err = section.Get(nil, limit, false)
	}

	if err != nil {
		ctx.FailErr(500, "Failed to fetch sections: "+err.Error())
		return
	}

	// Get total count for pagination info
	total := len(sections)

	ctx.Success(gin.H{
		"status":   "success",
		"data":     sections,
		"total":    total,
		"page":     page,
		"size":     pageSize,
		"has_next": total > (page * pageSize),
	})
}

func sectionsUpdateHandler(ctx ginc.Contexter) {
	idStr := ctx.GinCtx().Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		ctx.FailErr(400, "Invalid section ID")
		return
	}

	var updates map[string]interface{}
	if err := ctx.ParseReqbody(&updates); err != nil {
		return
	}

	// Update the section with provided fields by creating a new section instance
	updatedSection := &db.Section{ID: id}

	// Update fields based on the provided updates map
	for key, value := range updates {
		switch key {
		case "book_id":
			if val, ok := value.(float64); ok {
				updatedSection.BookId = int(val)
			}
		case "name":
			if val, ok := value.(string); ok {
				updatedSection.Name = val
			}
		case "describe":
			if val, ok := value.(string); ok {
				updatedSection.Description = val
			}
		case "size":
			if val, ok := value.(float64); ok {
				updatedSection.Size = int(val)
			}
		}
	}

	// Get all field names to update
	keys := make([]string, 0, len(updates))
	for key := range updates {
		keys = append(keys, key)
	}

	// Update the section record
	if err := updatedSection.UpdateByID(id, keys...); err != nil {
		ctx.FailErr(500, "Failed to update section: "+err.Error())
		return
	}

	ctx.Success(gin.H{
		"status": "success",
		"msg":    "Section updated successfully",
		"data":   gin.H{"id": id},
	})
}

func sectionsDeleteHandler(ctx ginc.Contexter) {
	idStr := ctx.GinCtx().Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		ctx.FailErr(400, "Invalid section ID")
		return
	}

	var section db.Section
	err = section.Del(map[string]any{"id": id})
	if err != nil {
		ctx.FailErr(500, "Failed to delete section: "+err.Error())
		return
	}

	ctx.Success(gin.H{
		"status": "success",
		"msg":    "Section deleted successfully",
	})
}

func ttsHandler(ctx ginc.Contexter) {
	var ttsReq TTSRequest
	if err := ctx.ParseReqbody(&ttsReq); err != nil {
		return
	}

	if list, err := (&db.TTSRecord{}).Get(map[string]any{"id": ttsReq.ID}, nil); err == nil {
		record := list[0]
		if db.TTSRecordISLocked(record.Status) {
			ctx.Success(gin.H{
				"status":  "success",
				"outpath": record.OutputWavPath,
			})
			return
		}
	}

	fmt.Printf("Received TTS request: %+v\n", ttsReq)

	if _, err := os.Stat(OUTPUT_DIR); os.IsNotExist(err) {
		os.Mkdir(OUTPUT_DIR, 0o755)
	}

	// Use the centralized function to generate the filename
	newFileName := GenerateTTSFilename(ttsReq)
	ttsReq.OutputWavPath = filepath.Join(OUTPUT_DIR, newFileName)

	externalApiURL := "http://127.0.0.1:8800/inference"

	if err := synthesizeSpeech(externalApiURL, ttsReq); err != nil {
		ctx.FailErr(500, "Failed to synthesize speech: "+err.Error())
		return
	}

	// absPath, err := filepath.Abs(ttsReq.OutputWavPath)
	// if err != nil {
	// 	ctx.FailErr(500, "Could not construct file path for response: "+err.Error())
	// 	return
	// }

	// newFile := FileItem{
	// 	Name: filepath.ToSlash(ttsReq.OutputWavPath),
	// 	Path: absPath,
	// 	URL:  "/api/audio-file/" + filepath.ToSlash(ttsReq.OutputWavPath),
	// }

	// Update the TTS record in the database with the output path and success status
	if err := (&db.TTSRecord{OutputWavPath: newFileName}).UpdateByID(ttsReq.ID, "output_wav_path"); err != nil {
		ctx.FailErr(400100, err.Error())
		return

	}

	ctx.Success(gin.H{
		"status":  "success",
		"outpath": newFileName, // Return the output path
		// "newFile":       newFile,
	})
}

func checkTTSExistsHandler(ctx ginc.Contexter) {
	var ttsReq TTSRequest
	if err := ctx.ParseReqbody(&ttsReq); err != nil {
		return
	}

	fileName := ""
	fmt.Println("ttsReq.ID:", ttsReq.ID)
	if ttsReq.ID != 0 {
		// list, err := (&db.TTSRecord{}).GetFunc(func(s *sqlite.Sql) *sqlite.Sql { return s.Where(map[string]any{"id": ttsReq.ID}) })
		if list, err := (&db.TTSRecord{}).Get(map[string]any{"id": ttsReq.ID}, nil); err != nil {
			ctx.FailErr(500100, err.Error())
			return
		} else {
			fileName = list[0].OutputWavPath
		}
	} else {
		fileName = GenerateTTSFilename(ttsReq)
	}

	filePath := filepath.Join(OUTPUT_DIR, fileName)
	fmt.Println(filePath, fileName)

	if finfo, err := os.Stat(filePath); !finfo.IsDir() && err == nil {
		// File exists
		ctx.Success(gin.H{
			"exists":  true,
			"outpath": fileName,
			// "outpath": filepath.ToSlash(filePath),
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
	book_id := ctx.Query("book_id")
	section_id := ctx.Query("section_id")
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

// ttsTplBulkDelete deletes TTS records by book_id and section_id
func ttsTplBulkDelete(ctx ginc.Contexter) {
	book_id := ctx.Query("book_id")
	section_id := ctx.Query("section_id")

	// Validate parameters
	if book_id == "" || section_id == "" {
		ctx.FailErr(400, "book_id and section_id parameters are required")
		return
	}

	// Convert string parameters to integers
	bookId, err := strconv.Atoi(book_id)
	if err != nil {
		ctx.FailErr(400, "Invalid book_id parameter")
		return
	}

	sectionId, err := strconv.Atoi(section_id)
	if err != nil {
		ctx.FailErr(400, "Invalid section_id parameter")
		return
	}

	// Create a TTSRecord instance and delete records matching the criteria
	record := &db.TTSRecord{}
	whereConditions := map[string]any{
		"book_id":    bookId,
		"section_id": sectionId,
	}

	// Perform the deletion
	deleteErr := record.Del(whereConditions)
	if deleteErr != nil {
		ctx.FailErr(500, "Failed to delete records: "+deleteErr.Error())
		return
	}

	ctx.Success(gin.H{
		"status":  "success",
		"message": "Successfully deleted",
	})
}

// ttsTplUpdate updates a single TTS record by ID
func ttsTplUpdate(ctx ginc.Contexter) {
	idstr := ctx.ParamRoute("id")

	// Convert ID string to integer
	id, err := strconv.Atoi(idstr)
	if err != nil {
		ctx.FailErr(400, "Invalid ID parameter")
		return
	}

	// Parse the update data from request body
	var record db.TTSRecord
	if err := ctx.ParseReqbody(&record); err != nil {
		return
	}
	fmt.Println(record)

	updateKeys := make([]string, 16)
	if record.Role != "" {
		updateKeys = append(updateKeys, "role")
	}
	if record.Status != "" {
		updateKeys = append(updateKeys, "status")
	}
	if record.Text != "" {
		updateKeys = append(updateKeys, "text")
	}
	if record.EmotionText != "" {
		updateKeys = append(updateKeys, "emotion_text")
	}
	if record.EmotionAlpha != 0 {
		updateKeys = append(updateKeys, "emotion_alpha")
	}
	if record.IntervalSilence != 0 {
		updateKeys = append(updateKeys, "interval_silence")
	}
	if record.AudioEndTruncate != 0 {
		updateKeys = append(updateKeys, "audio_end_truncate")
	}

	// Call update by ID to update the record
	updateErr := record.UpdateByID(id, updateKeys...)
	if updateErr != nil {
		ctx.FailErr(500, "Failed to update record: "+updateErr.Error())
		return
	}

	ctx.Success(gin.H{
		"status":  "success",
		"message": "Record updated successfully",
		"data":   gin.H{"id": id},
	})
}

// 拆分
func ttsTplSplit(ctx ginc.Contexter) {
	idstr := ctx.ParamRoute("id")

	// Convert ID string to integer
	id, err := strconv.Atoi(idstr)
	if err != nil {
		ctx.FailErr(400, "Invalid ID parameter")
		return
	}

	// Parse the update data from request body
	var texts []string
	if err := ctx.ParseReqbody(&texts); err != nil {
		return
	}

	records, err := (&db.TTSRecord{}).Get(map[string]int{"id": id}, nil)
	if err != nil {
		ctx.FailErr(500, "Failed find record: "+err.Error())
		return
	}
	db_record := records[0]
	fmt.Println(db_record)

	db_record.Text = texts[0]
	// Call update by ID to update the record
	updateErr := db_record.UpdateByID(id, "text")
	if updateErr != nil {
		ctx.FailErr(500, "Failed to update record: "+updateErr.Error())
		return
	}

	db_record.Text = texts[1]
	db_record.No = db_record.No + 1
	if err := db_record.Add(); err != nil {
		ctx.FailErr(500, "Failed to add record: "+err.Error())
		return
	}

	ctx.Success(gin.H{
		"status":  "success",
		"message": "Record updated successfully",
		"data":   gin.H{"id": id},
	})
}

// ttsTplDelete deletes a single TTS record by ID
func ttsTplDelete(ctx ginc.Contexter) {
	idstr := ctx.ParamRoute("id")

	// Convert ID string to integer
	id, err := strconv.Atoi(idstr)
	if err != nil {
		ctx.FailErr(400, "Invalid ID parameter")
		return
	}

	// Create a TTSRecord instance and delete the record by ID
	record := &db.TTSRecord{}
	whereConditions := map[string]any{
		"id": id,
	}

	// Perform the deletion
	deleteErr := record.Del(whereConditions)
	if deleteErr != nil {
		ctx.FailErr(500, "Failed to delete record: "+deleteErr.Error())
		return
	}

	ctx.Success(gin.H{
		"status":  "success",
		"message": "Successfully deleted",
		"data":   gin.H{"id": id},
	})
}

// BatchSynthesizeRequest defines the structure for the batch synthesis request
type BatchSynthesizeRequest struct {
	UserID    int `json:"user_id"`
	BookID    int `json:"book_id"`
	SectionID int `json:"section_id"`
}

// batchSynthesizeHandler handles the request to synthesize multiple audio files into one.
func batchSynthesizeHandler(ctx ginc.Contexter) {
	var req BatchSynthesizeRequest
	if err := ctx.ParseReqbody(&req); err != nil {
		return // error is handled by ParseReqbody
	}

	record := &db.TTSRecord{}
	querys := map[string]any{
		"user_id":    req.UserID,
		"book_id":    req.BookID,
		"section_id": req.SectionID,
	}

	// Get records, ordered by 'no' to ensure correct sequence
	list, err := record.GetFunc(func(s *sqlite.Sql) *sqlite.Sql {
		return s.Where(querys).Order("no asc")
	})
	if err != nil {
		ctx.FailErr(500, "Failed to query TTS records: "+err.Error())
		return
	}

	if len(list) == 0 {
		ctx.FailErr(404, "No TTS records found for the given criteria.")
		return
	}

	var inputPaths []string
	for _, r := range list {
		if r.OutputWavPath != "" {
			fullPath := filepath.Join(OUTPUT_DIR, r.OutputWavPath)
			if _, err := os.Stat(fullPath); err == nil {
				inputPaths = append(inputPaths, fullPath)
			} else {
				log.Printf("Warning: audio file not found and will be skipped: %s", fullPath)
			}
		}
	}

	if len(inputPaths) == 0 {
		ctx.FailErr(404, "No existing audio files found for the records. Please train them first.")
		return
	}

	timestamp := time.Now().Unix()
	outputFilename := fmt.Sprintf("%d_%d_%d_%d.m4a", req.UserID, req.BookID, req.SectionID, timestamp)
	outputPath := filepath.Join(OUTPUT_DIR, outputFilename)

	// Run the audio joining in a background goroutine to avoid blocking the request
	// go Joint(inputPaths, outputPath)
	Joint(inputPaths, outputPath)

	ctx.Success(gin.H{
		"status":      "processing",
		"message":     "Batch synthesis started. The output will be available shortly.",
		"output_path": outputPath,
	})
}

// BookDubbings handlers
func bookDubbingsHandler(ctx ginc.Contexter) {
	var bookDubbingReq db.BookDubbing
	if err := ctx.ParseReqbody(&bookDubbingReq); err != nil {
		return
	}

	// Add the new book_dubbing to the database
	ret, err := bookDubbingReq.Add()
	if err != nil {
		ctx.FailErr(500, "Failed to add book dubbing: "+err.Error())
		return
	}

	ctx.Success(gin.H{
		"status": "success",
		"data":   gin.H{"id": ret.Id},
	})
}

func bookDubbingsListHandler(ctx ginc.Contexter) {
	// Extract query parameters for filtering
	bookIDStr := ctx.GinCtx().Query("book_id")
	dubbingIDStr := ctx.GinCtx().Query("dubbing_id")
	pageStr := ctx.GinCtx().Query("page")
	pageSizeStr := ctx.GinCtx().Query("size")

	filters := make(map[string]interface{})

	if bookIDStr != "" {
		if bookID, err := strconv.Atoi(bookIDStr); err == nil {
			filters["book_id"] = bookID
		}
	}

	if dubbingIDStr != "" {
		if dubbingID, err := strconv.Atoi(dubbingIDStr); err == nil {
			filters["dubbing_id"] = dubbingID
		}
	}

	// Parse pagination parameters
	page := 1
	pageSize := 20

	if pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}

	if pageSizeStr != "" {
		if ps, err := strconv.Atoi(pageSizeStr); err == nil && ps > 0 {
			if ps > 100 { // Limit maximum page size
				ps = 100
			}
			pageSize = ps
		}
	}

	// Calculate offset for pagination
	offset := (page - 1) * pageSize
	limit := []string{strconv.Itoa(offset), strconv.Itoa(pageSize)}

	var bookDubbing db.BookDubbing
	var bookDubbings []*db.BookDubbing
	var err error

	if len(filters) > 0 {
		bookDubbings, err = bookDubbing.Get(filters, limit, false)
	} else {
		bookDubbings, err = bookDubbing.Get(nil, limit, false)
	}

	if err != nil {
		ctx.FailErr(500, "Failed to fetch book dubbings: "+err.Error())
		return
	}

	// Get total count for pagination info
	total := bookDubbing.Count()

	ctx.Success(gin.H{
		"status":   "success",
		"data":     bookDubbings,
		"total":    total,
		"page":     page,
		"size":     pageSize,
		"has_next": total > (page * pageSize),
	})
}

func bookDubbingsUpdateHandler(ctx ginc.Contexter) {
	idStr := ctx.GinCtx().Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		ctx.FailErr(400, "Invalid book dubbing ID")
		return
	}

	var updates map[string]interface{}
	if err := ctx.ParseReqbody(&updates); err != nil {
		return
	}

	// Update the book_dubbing with provided fields by creating a new book_dubbing instance
	updatedBookDubbing := &db.BookDubbing{ID: id}

	// Update fields based on the provided updates map
	for key, value := range updates {
		switch key {
		case "book_id":
			if val, ok := value.(float64); ok {
				updatedBookDubbing.BookId = int(val)
			}
		case "dubbing_id":
			if val, ok := value.(float64); ok {
				updatedBookDubbing.DubbingId = int(val)
			}
		}
	}

	// Get all field names to update
	keys := make([]string, 0, len(updates))
	for key := range updates {
		keys = append(keys, key)
	}

	// Update the book_dubbing record
	if err := updatedBookDubbing.UpdateByID(id, keys...); err != nil {
		ctx.FailErr(500, "Failed to update book dubbing: "+err.Error())
		return
	}

	ctx.Success(gin.H{
		"status": "success",
		"msg":    "Book dubbing updated successfully",
		"data":   gin.H{"id": id},
	})
}

func bookDubbingsDeleteHandler(ctx ginc.Contexter) {
	idStr := ctx.GinCtx().Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		ctx.FailErr(400, "Invalid book dubbing ID")
		return
	}

	var bookDubbing db.BookDubbing
	err = bookDubbing.Del(map[string]any{"id": id})
	if err != nil {
		ctx.FailErr(500, "Failed to delete book dubbing: "+err.Error())
		return
	}

	ctx.Success(gin.H{
		"status": "success",
		"msg":    "Book dubbing deleted successfully",
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

// File upload handler
func uploadHandler(ctx ginc.Contexter) {
	c := ctx.GinCtx()

	// Parse multipart form
	err := c.Request.ParseMultipartForm(32 << 20) // 32MB max memory
	if err != nil {
		ctx.FailErr(400, "Failed to parse form: "+err.Error())
		return
	}

	// Handle file upload
	uploadDir := filepath.Join("assets", "uploads")

	file, err := c.FormFile("file")
	if err != nil {
		ctx.FailErr(400, "No file provided: "+err.Error())
		return
	}

	// Create upload directory if it doesn't exist
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		ctx.FailErr(500, "Failed to create upload directory: "+err.Error())
		return
	}

	// Generate unique filename
	ext := filepath.Ext(file.Filename)
	filename := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)
	filePath := filepath.Join(uploadDir, filename)

	// Save file
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		ctx.FailErr(500, "Failed to save file: "+err.Error())
		return
	}

	// Return relative path
	relativePath := filepath.Join("uploads", filename)
	ctx.Success(gin.H{
		"status": "success",
		"data":   relativePath,
	})
}
