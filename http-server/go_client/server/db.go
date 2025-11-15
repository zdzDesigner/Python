package main

import (
	"fmt"
	"log"
	"os"
	"time"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// InitDB initializes the SQLite database connection
func InitDB() error {
	// Create a logs directory if it doesn't exist
	if err := os.MkdirAll("logs", os.ModePerm); err != nil {
		return fmt.Errorf("failed to create logs directory: %v", err)
	}

	// Create a custom logger that writes to a file
	newLogger := logger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags), // io writer
		logger.Config{
			SlowThreshold:             time.Second,  // Slow SQL threshold
			LogLevel:                  logger.Info,  // Log level
			IgnoreRecordNotFoundError: false,        // Don't ignore record not found errors
			Colorful:                  false,        // Disable color
		},
	)

	db, err := gorm.Open(sqlite.Open("audio_server.db"), &gorm.Config{
		Logger: newLogger,
	})
	if err != nil {
		return fmt.Errorf("failed to connect to database: %v", err)
	}

	// Set database instance globally
	DB = db

	// Run migrations
	if err := runMigrations(); err != nil {
		return fmt.Errorf("failed to run migrations: %v", err)
	}

	return nil
}

// runMigrations runs all database migrations to create tables
func runMigrations() error {
	// Auto-migrate all defined models
	err := DB.AutoMigrate(
		&TTSRecord{},
		&User{},
		&AudioFile{},
	)
	if err != nil {
		return fmt.Errorf("failed to migrate database: %v", err)
	}

	return nil
}

// CloseDB closes the database connection
func CloseDB() error {
	if DB == nil {
		return nil
	}

	sqlDB, err := DB.DB()
	if err != nil {
		return err
	}

	return sqlDB.Close()
}