package section

import (
	"fmt"
	"strconv"

	"go-audio-server/db"
	"go-audio-server/internal/ginc"

	"github.com/gin-gonic/gin"
)

func sectionsHandler(ctx ginc.Contexter) {
	var sectionReq db.Section
	if err := ctx.ParseReqbody(&sectionReq); err != nil {
		return
	}

	// Validate required fields
	if sectionReq.BookId == 0 {
		ctx.FailErr(400, "BookID is required")
		return
	}
	if sectionReq.Name == "" {
		ctx.FailErr(400, "Name is required")
		return
	}

	// Create section in database
	ret, err := sectionReq.Add()
	if err != nil {
		ctx.FailErr(500, "Failed to create section: "+err.Error())
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
	if name != "" {
		filters["name"] = name
	}

	// Get sections with pagination
	var section db.Section
	sections, err := section.Get(filters, []string{fmt.Sprintf("%d", page), fmt.Sprintf("%d", pageSize)}, false)
	if err != nil {
		ctx.FailErr(500, "Failed to fetch sections: "+err.Error())
		return
	}

	// Get total count
	total := section.Count()

	// Convert sections to JSON-serializable format
	sectionList := make([]gin.H, len(sections))
	for i, s := range sections {
		sectionList[i] = gin.H{
			"id":          s.ID,
			"book_id":     s.BookId,
			"name":        s.Name,
			"describe":    s.Description,
			"size":        s.Size,
			"create_time": s.CreatedAt,
			"update_time": s.UpdatedAt,
		}
	}

	ctx.Success(gin.H{
		"status":     "success",
		"data":       sectionList,
		"total":      total,
		"page":       page,
		"size":       pageSize,
		"has_next":   total > (page * pageSize),
	})
}

func sectionsUpdateHandler(ctx ginc.Contexter) {
	idStr := ctx.GinCtx().Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		ctx.FailErr(400, "Invalid section ID")
		return
	}

	var sectionReq db.Section
	if err := ctx.ParseReqbody(&sectionReq); err != nil {
		return
	}

	// Get all non-empty fields to update
	keys := []string{}
	if sectionReq.BookId != 0 {
		keys = append(keys, "book_id")
	}
	if sectionReq.Name != "" {
		keys = append(keys, "name")
	}
	if sectionReq.Description != "" {
		keys = append(keys, "describe")
	}
	if sectionReq.Size != 0 {
		keys = append(keys, "size")
	}

	// If no fields to update, return error
	if len(keys) == 0 {
		ctx.FailErr(400, "No fields to update")
		return
	}

	// Update the section record
	var updatedSection db.Section
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

func RegisterRoutes(api *gin.RouterGroup) {
	// Sections API routes
	api.POST("/sections", ginc.Handler(sectionsHandler))
	api.GET("/sections", ginc.Handler(sectionsListHandler))
	api.PUT("/sections/:id", ginc.Handler(sectionsUpdateHandler))
	api.DELETE("/sections/:id", ginc.Handler(sectionsDeleteHandler))
}