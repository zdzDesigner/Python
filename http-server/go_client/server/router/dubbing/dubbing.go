package dubbing

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"go-audio-server/db"
	"go-audio-server/internal/ginc"

	"github.com/gin-gonic/gin"
)

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

// Dubbings handlers
func dubbingsHandler(ctx ginc.Contexter) {
	c := ctx.GinCtx()

	// Parse multipart form using the abstracted method
	if err := ctx.ParseMultipartForm(32 << 20); err != nil {
		return
	}

	// Parse form fields into dubbingReq
	var dubbingReq db.Dubbing
	dubbingReq.Name = c.PostForm("name")
	dubbingReq.AgeText = c.PostForm("age_text")
	dubbingReq.EmotionText = c.PostForm("emotion_text")
	dubbingReq.Avatar = c.PostForm("avatar")
	dubbingReq.WavPath = c.PostForm("wav_path")

	fmt.Println("dubbingReq:", dubbingReq)

	// Handle file uploads
	uploadDir := filepath.Join("assets", "uploads")
	// Handle avatar upload
	if _, err := c.FormFile("avatar_file"); err == nil {
		if avatarPath, err := saveUploadedFile(c, "avatar_file", uploadDir); err == nil {
			dubbingReq.Avatar = avatarPath
		}
	}
	// Handle wav file upload
	if _, err := c.FormFile("wav_file"); err == nil {
		if wavPath, err := saveUploadedFile(c, "wav_file", uploadDir); err == nil {
			dubbingReq.WavPath = wavPath
		}
	}

	// Validate required fields
	if dubbingReq.Name == "" {
		ctx.FailErr(400, "Name is required")
		return
	}
	if dubbingReq.AgeText == "" {
		ctx.FailErr(400, "AgeText is required")
		return
	}
	if dubbingReq.EmotionText == "" {
		ctx.FailErr(400, "EmotionText is required")
		return
	}

	// Create dubbing in database
	ret, err := dubbingReq.Add()
	if err != nil {
		ctx.FailErr(500, "Failed to create dubbing: "+err.Error())
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

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}

	pageSize, err := strconv.Atoi(pageSizeStr)
	if err != nil || pageSize < 1 {
		pageSize = 10
	}

	// Prepare filter conditions
	filters := make(map[string]interface{})
	if name != "" {
		filters["name"] = name
	}

	// Get dubbings with pagination
	var dubbing db.Dubbing
	dubbings, err := dubbing.Get(filters, []string{fmt.Sprintf("%d", page), fmt.Sprintf("%d", pageSize)}, false)
	if err != nil {
		ctx.FailErr(500, "Failed to fetch dubbings: "+err.Error())
		return
	}

	// Get total count
	total := dubbing.Count()

	// Convert dubbings to JSON-serializable format
	dubbingList := make([]gin.H, len(dubbings))
	for i, d := range dubbings {
		dubbingList[i] = gin.H{
			"id":           d.ID,
			"name":         d.Name,
			"age_text":     d.AgeText,
			"emotion_text": d.EmotionText,
			"avatar":       d.Avatar,
			"wav_path":     d.WavPath,
			"create_time":  d.CreatedAt,
			"update_time":  d.UpdatedAt,
		}
	}

	ctx.Success(gin.H{
		"status":   "success",
		"data":     dubbingList,
		"total":    total,
		"page":     page,
		"size":     pageSize,
		"has_next": total > (page * pageSize),
	})
}

func dubbingsUpdateHandler(ctx ginc.Contexter) {
	c := ctx.GinCtx()
	idStr := ctx.GinCtx().Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		ctx.FailErr(400, "Invalid dubbing ID")
		return
	}

	// Parse multipart form using the abstracted method (ignore errors for optional form data)
	if err := ctx.ParseMultipartForm(32 << 20); err != nil {
		return
	}

	var dubbingReq db.Dubbing
	dubbingReq.Name = c.PostForm("name")
	dubbingReq.AgeText = c.PostForm("age_text")
	dubbingReq.EmotionText = c.PostForm("emotion_text")
	dubbingReq.Avatar = c.PostForm("avatar")
	dubbingReq.WavPath = c.PostForm("wav_path")

	fmt.Println("dubbingReq:", dubbingReq)
	// Handle file uploads
	uploadDir := filepath.Join("assets", "uploads")
	// Handle avatar upload
	if _, err := c.FormFile("avatar_file"); err == nil {
		if avatarPath, err := saveUploadedFile(c, "avatar_file", uploadDir); err == nil {
			dubbingReq.Avatar = avatarPath
		}
	}
	// Handle wav file upload
	if _, err := c.FormFile("wav_file"); err == nil {
		if wavPath, err := saveUploadedFile(c, "wav_file", uploadDir); err == nil {
			dubbingReq.WavPath = wavPath
		}
	}

	// Get all non-empty fields to update
	keys := []string{}
	if dubbingReq.Name != "" {
		keys = append(keys, "name")
	}
	if dubbingReq.AgeText != "" {
		keys = append(keys, "age_text")
	}
	if dubbingReq.EmotionText != "" {
		keys = append(keys, "emotion_text")
	}
	if dubbingReq.Avatar != "" {
		keys = append(keys, "avatar")
	}
	if dubbingReq.WavPath != "" {
		keys = append(keys, "wav_path")
	}

	// If no fields to update, return error
	if len(keys) == 0 {
		ctx.FailErr(400, "No fields to update")
		return
	}

	// Update the dubbing record
	if err := dubbingReq.UpdateByID(id, keys...); err != nil {
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

// BookDubbings handlers
func bookDubbingsHandler(ctx ginc.Contexter) {
	var bookDubbingReq db.BookDubbing
	if err := ctx.ParseReqbody(&bookDubbingReq); err != nil {
		return
	}

	// Validate required fields
	if bookDubbingReq.BookId == 0 {
		ctx.FailErr(400, "BookID is required")
		return
	}
	if bookDubbingReq.DubbingId == 0 {
		ctx.FailErr(400, "DubbingID is required")
		return
	}

	// Create book_dubbing in database
	ret, err := bookDubbingReq.Add()
	if err != nil {
		ctx.FailErr(500, "Failed to create book dubbing: "+err.Error())
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

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}

	pageSize, err := strconv.Atoi(pageSizeStr)
	if err != nil || pageSize < 1 {
		pageSize = 10
	}

	// Prepare filter conditions
	filters := make(map[string]interface{})
	if bookIDStr != "" {
		bookID, err := strconv.Atoi(bookIDStr)
		if err == nil {
			filters["book_id"] = bookID
		}
	}
	if dubbingIDStr != "" {
		dubbingID, err := strconv.Atoi(dubbingIDStr)
		if err == nil {
			filters["dubbing_id"] = dubbingID
		}
	}

	// Get book_dubbings with pagination
	var bookDubbing db.BookDubbing
	bookDubbings, err := bookDubbing.Get(filters, []string{fmt.Sprintf("%d", page), fmt.Sprintf("%d", pageSize)}, false)
	if err != nil {
		ctx.FailErr(500, "Failed to fetch book dubbings: "+err.Error())
		return
	}

	// Get total count
	total := bookDubbing.Count()

	// Convert book_dubbings to JSON-serializable format
	bookDubbingList := make([]gin.H, len(bookDubbings))
	for i, bd := range bookDubbings {
		bookDubbingList[i] = gin.H{
			"id":          bd.ID,
			"book_id":     bd.BookId,
			"dubbing_id":  bd.DubbingId,
			"create_time": bd.CreatedAt,
			"update_time": bd.UpdatedAt,
		}
	}

	ctx.Success(gin.H{
		"status":   "success",
		"data":     bookDubbingList,
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

	var bookDubbingReq db.BookDubbing
	if err := ctx.ParseReqbody(&bookDubbingReq); err != nil {
		return
	}

	// Get all non-empty fields to update
	keys := []string{}
	if bookDubbingReq.BookId != 0 {
		keys = append(keys, "book_id")
	}
	if bookDubbingReq.DubbingId != 0 {
		keys = append(keys, "dubbing_id")
	}

	// If no fields to update, return error
	if len(keys) == 0 {
		ctx.FailErr(400, "No fields to update")
		return
	}

	// Update the book_dubbing record
	var updatedBookDubbing db.BookDubbing
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

func dubbingsBatchUploadHandler(ctx ginc.Contexter) {
	c := ctx.GinCtx()

	// Get Content-Length from request header
	contentLength := c.Request.ContentLength
	log.Printf("Batch upload request Content-Length: %d bytes (%.2f MB)", contentLength, float64(contentLength)/(1024*1024))

	// Determine max memory based on content length
	maxMemory := int64(100 << 20) // Default 100MB
	if contentLength > 0 && contentLength < maxMemory {
		maxMemory = contentLength + (10 << 20) // Content-Length + 10MB buffer
	}

	// Parse multipart form
	err := c.Request.ParseMultipartForm(maxMemory)
	if err != nil {
		ctx.FailErr(400, "Failed to parse multipart form: "+err.Error())
		return
	}

	form, err := c.MultipartForm()
	if err != nil {
		ctx.FailErr(400, "Failed to get multipart form: "+err.Error())
		return
	}

	files := form.File["audio_files"]
	if len(files) == 0 {
		ctx.FailErr(400, "No audio files provided")
		return
	}

	uploadDir := filepath.Join("assets", "uploads")
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		ctx.FailErr(500, "Failed to create upload directory: "+err.Error())
		return
	}

	successCount := 0
	failedCount := 0
	results := []gin.H{}

	for _, file := range files {
		// Generate unique filename
		ext := filepath.Ext(file.Filename)
		filename := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)
		filePath := filepath.Join(uploadDir, filename)

		// Save file
		if err := c.SaveUploadedFile(file, filePath); err != nil {
			failedCount++
			results = append(results, gin.H{
				"filename": file.Filename,
				"status":   "failed",
				"error":    err.Error(),
			})
			continue
		}

		// Create dubbing record
		relativePath := filepath.Join("uploads", filename)
		dubbingReq := db.Dubbing{
			Name:        file.Filename,
			AgeText:     "未知",
			EmotionText: "中性",
			Avatar:      "",
			WavPath:     relativePath,
		}

		ret, err := dubbingReq.Add()
		if err != nil {
			failedCount++
			results = append(results, gin.H{
				"filename": file.Filename,
				"status":   "failed",
				"error":    "Failed to create database record: " + err.Error(),
			})
			// Clean up uploaded file
			os.Remove(filePath)
			continue
		}

		successCount++
		results = append(results, gin.H{
			"filename": file.Filename,
			"status":   "success",
			"id":       ret.Id,
		})
	}

	ctx.Success(gin.H{
		"status":        "completed",
		"total":         len(files),
		"success_count": successCount,
		"failed_count":  failedCount,
		"results":       results,
	})
}

func RegisterRoutes(api *gin.RouterGroup) {
	// Dubbings API routes
	api.POST("/dubbings", ginc.Handler(dubbingsHandler))
	api.POST("/dubbings/batch", ginc.Handler(dubbingsBatchUploadHandler))
	api.GET("/dubbings", ginc.Handler(dubbingsListHandler))
	api.PUT("/dubbings/:id", ginc.Handler(dubbingsUpdateHandler))
	api.DELETE("/dubbings/:id", ginc.Handler(dubbingsDeleteHandler))

	// BookDubbings API routes
	api.POST("/book-dubbings", ginc.Handler(bookDubbingsHandler))
	api.GET("/book-dubbings", ginc.Handler(bookDubbingsListHandler))
	api.PUT("/book-dubbings/:id", ginc.Handler(bookDubbingsUpdateHandler))
	api.DELETE("/book-dubbings/:id", ginc.Handler(bookDubbingsDeleteHandler))
}

