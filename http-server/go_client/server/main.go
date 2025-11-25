package main

import (
	"fmt"
	"net/http"
	"os"

	"go-audio-server/db/sqlite"
	"go-audio-server/internal/ginc"

	"github.com/gin-gonic/gin"
)

func main() {
	checkAvailableEncoders()
	// Initialize SQLite database
	dbConfig := map[string]string{
		"DBPath": "assets/audio_server.db",
	}
	sqlite.Boot(dbConfig)

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
		api.GET("/audio-files", ginc.Handler(audioFilesHandler))
		api.GET("/audio-file/*path", audioFileHandler)
		api.POST("/tts", ginc.Handler(ttsHandler))
		api.POST("/tts/split/:id", ginc.Handler(ttsTplSplit))
		api.POST("/tts/check", ginc.Handler(checkTTSExistsHandler))
		api.POST("/tts-tpl", ginc.Handler(ttsTplHandler))
		api.GET("/tts-tpl", ginc.Handler(ttsTplList))
		api.PUT("/tts-tpl/:id", ginc.Handler(ttsTplUpdate))
		api.DELETE("/tts-tpl", ginc.Handler(ttsTplBulkDelete))
		api.DELETE("/delete-file", ginc.Handler(deleteAudioFileHandler))
		api.POST("/remove-special-symbols", ginc.Handler(removeSpecialSymbolsHandler))
		api.POST("/sanitize-filenames", ginc.Handler(sanitizeFilenamesHandler))
		api.POST("/audio/joint", ginc.Handler(batchSynthesizeHandler))
		api.DELETE("/tts-tpl/:id", ginc.Handler(ttsTplDelete))
		
		// Sections API routes
		api.POST("/sections", ginc.Handler(sectionsHandler))
		api.GET("/sections", ginc.Handler(sectionsListHandler))
		api.PUT("/sections/:id", ginc.Handler(sectionsUpdateHandler))
		api.DELETE("/sections/:id", ginc.Handler(sectionsDeleteHandler))
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
