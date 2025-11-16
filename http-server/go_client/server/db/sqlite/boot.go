package sqlite

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

var (
	db     *sql.DB
	Tables []string = []string{}
)

func Boot(config map[string]string) {
	var err error
	if db != nil {
		return
	}
	
	dbPath := config["DBPath"]
	if dbPath == "" {
		dbPath = "audio_server.db" // Default database path
	}
	
	// Ensure the directory for the database exists
	dbDir := filepath.Dir(dbPath)
	if dbDir != "." && dbDir != "/" {
		if err := os.MkdirAll(dbDir, 0755); err != nil {
			log.Fatalf("Failed to create database directory: %v", err)
		}
	}

	db, err = open(dbPath)
	if err != nil {
		panic(err)
	}

	db.SetMaxOpenConns(20)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(1 * time.Hour)
	if err = db.Ping(); err != nil {
		db.Close()
		panic(err)
	}

	Tables, _ = tables()
	
	// Execute the SQL migration file
	if err := ExecuteMigrationFile(); err != nil {
		log.Printf("Warning: Failed to execute migration file: %v", err)
	}
}

func open(dbPath string) (*sql.DB, error) {
	// Use the SQLite driver and create the database file if it doesn't exist
	conn, err := sql.Open("sqlite3", dbPath+"?_busy_timeout=30000&_journal_mode=WAL")
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %v", err)
	}

	// Enable foreign key constraints
	_, err = conn.Exec("PRAGMA foreign_keys = ON;")
	if err != nil {
		return nil, fmt.Errorf("failed to enable foreign keys: %v", err)
	}

	return conn, nil
}

// ExecuteMigrationFile reads and executes the SQL migration file
func ExecuteMigrationFile() error {
	sqlFilePath := "build/SQL/sqlite.sql"
	
	// Check if the file exists, if not try alternative locations
	if _, err := os.Stat(sqlFilePath); os.IsNotExist(err) {
		// Try looking in the server directory
		sqlFilePath = "./build/SQL/sqlite.sql"
		if _, err := os.Stat(sqlFilePath); os.IsNotExist(err) {
			return fmt.Errorf("migration file not found: %s", sqlFilePath)
		}
	}
	
	sqlBytes, err := os.ReadFile(sqlFilePath)
	if err != nil {
		return fmt.Errorf("failed to read migration file: %v", err)
	}
	
	sqlContent := string(sqlBytes)
	
	// Split the SQL content by semicolons and execute each statement
	// Handle the PRAGMA statements and other multiple statements
	statements := strings.Split(sqlContent, ";")
	
	for _, statement := range statements {
		statement = strings.TrimSpace(statement)
		if statement == "" {
			continue
		}
		
		if _, err := db.Exec(statement); err != nil {
			// Log the error but don't fail completely if it's a duplicate table error
			// Some databases will return an error if table already exists
			log.Printf("SQL statement execution error (continuing): %s - %v", statement, err)
		}
	}
	
	return nil
}

func mustexec(SQL string) (err error) {
	_, err = db.Exec(SQL)
	return
}

// Create table
func Create(SQL string) error {
	_, err := db.Exec(SQL)
	if err != nil {
		return err
	}
	Tables, _ = tables()
	return nil
}

// Exec executes a SQL statement
func Exec(SQL string) error {
	_, err := db.Exec(SQL)
	return err
}

// TransactionStart begins a transaction
func TransactionStart() error { return mustexec("BEGIN;") }

// TransactionCommit commits a transaction
func TransactionCommit() error { return mustexec("COMMIT;") }

// TransactionRollback rolls back a transaction
func TransactionRollback() error { return mustexec("ROLLBACK;") }