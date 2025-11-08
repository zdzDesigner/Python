package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

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