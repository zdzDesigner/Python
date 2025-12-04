package book

import (
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"go-audio-server/db"
	"go-audio-server/db/sqlite"
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

// Books handlers
func booksHandler(ctx ginc.Contexter) {
	c := ctx.GinCtx()
	
	// Parse multipart form using the abstracted method (ignore errors for optional form data)
	_ = ctx.ParseMultipartForm(32 << 20)

	var bookReq db.Book
	if err := ctx.ParseReqbody(&bookReq); err != nil {
		return
	}

	// Handle cover file upload
	uploadDir := filepath.Join("assets", "uploads")
	if _, err := c.FormFile("cover_file"); err == nil {
		if coverPath, err := saveUploadedFile(c, "cover_file", uploadDir); err == nil {
			bookReq.Bg = coverPath
		}
	}

	// Validate required fields
	if bookReq.Name == "" {
		ctx.FailErr(400, "Name is required")
		return
	}

	// Create book in database
	ret, err := bookReq.Add()
	if err != nil {
		ctx.FailErr(500, "Failed to create book: "+err.Error())
		return
	}

	ctx.Success(gin.H{
		"status": "success",
		"data":   gin.H{"id": ret.Id},
	})
}

func booksListHandler(ctx ginc.Contexter) {
	name := ctx.Query("name")
	page := ctx.Query("page")
	size := ctx.Query("size")

	// Prepare filter conditions
	filters := make(map[string]interface{})
	if name != "" {
		filters["name"] = name
	}

	// Get books with pagination
	var book db.Book
	books, err := book.Get(filters, sqlite.ToLimit(page, size), false)
	if err != nil {
		ctx.FailErr(500, "Failed to fetch books: "+err.Error())
		return
	}

	// Get total count
	total := book.Count()

	// Convert books to JSON-serializable format
	bookList := make([]gin.H, len(books))
	for i, b := range books {
		bookList[i] = gin.H{
			"id":          b.ID,
			"name":        b.Name,
			"describe":    b.Description,
			"bg":          b.Bg,
			"size":        b.Size,
			"create_time": b.CreatedAt,
			"update_time": b.UpdatedAt,
		}
	}

	ctx.Success(gin.H{
		"status": "success",
		"data":   bookList,
		"total":  total,
	})
}

func booksUpdateHandler(ctx ginc.Contexter) {
	idStr := ctx.GinCtx().Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		ctx.FailErr(400, "Invalid book ID")
		return
	}

	var bookReq db.Book
	if err := ctx.ParseReqbody(&bookReq); err != nil {
		return
	}

	c := ctx.GinCtx()
	// Parse multipart form using the abstracted method (ignore errors for optional form data)
	_ = ctx.ParseMultipartForm(32 << 20)

	// Handle cover file upload
	uploadDir := filepath.Join("assets", "uploads")
	if _, err := c.FormFile("cover_file"); err == nil {
		if coverPath, err := saveUploadedFile(c, "cover_file", uploadDir); err == nil {
			bookReq.Bg = coverPath
		}
	}

	// Get all non-empty fields to update
	keys := []string{}
	if bookReq.Name != "" {
		keys = append(keys, "name")
	}
	if bookReq.Description != "" {
		keys = append(keys, "describe")
	}
	if bookReq.Bg != "" {
		keys = append(keys, "bg")
	}
	if bookReq.Size > 0 {
		keys = append(keys, "size")
	}

	// If no fields to update, return error
	if len(keys) == 0 {
		ctx.FailErr(400, "No fields to update")
		return
	}

	// Update the book record
	if err := bookReq.UpdateByID(id, keys...); err != nil {
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

func RegisterRoutes(api *gin.RouterGroup) {
	// Books API routes
	api.POST("/books", ginc.Handler(booksHandler))
	api.GET("/books", ginc.Handler(booksListHandler))
	api.PUT("/books/:id", ginc.Handler(booksUpdateHandler))
	api.DELETE("/books/:id", ginc.Handler(booksDeleteHandler))
}