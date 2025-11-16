package main

import (
	"bytes"
	"crypto/md5"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// --- TTS Synthesis Logic ---

func synthesizeSpeech(apiURL string, request TTSRequest) error {
	var requestBody bytes.Buffer
	writer := multipart.NewWriter(&requestBody)

	if err := writer.WriteField("text", request.Text); err != nil {
		return fmt.Errorf("failed to add 'text' field: %w", err)
	}
	if err := writer.WriteField("use_emo_text", "true"); err != nil {
		return fmt.Errorf("failed to add 'use_emo_text' field: %w", err)
	}
	if request.EmotionText != "" {
		if err := writer.WriteField("emo_text", request.EmotionText); err != nil {
			return fmt.Errorf("failed to add 'emo_text' field: %w", err)
		}
	}
	if request.EmotionAlpha > 0 {
		if err := writer.WriteField("emo_alpha", fmt.Sprintf("%.2f", request.EmotionAlpha/10)); err != nil {
			return fmt.Errorf("failed to add 'emo_alpha' field: %w", err)
		}
	}
	if request.IntervalSilence > 0 {
		if err := writer.WriteField("interval_silence", fmt.Sprintf("%d", request.IntervalSilence)); err != nil {
			return fmt.Errorf("failed to add 'interval_silence' field: %w", err)
		}
	}

	file, err := os.Open(request.SpeakerAudioPath)
	if err != nil {
		return fmt.Errorf("could not open reference audio file '%s': %w", request.SpeakerAudioPath, err)
	}
	defer file.Close()

	part, err := writer.CreateFormFile("spk_audio_prompt", filepath.Base(request.SpeakerAudioPath))
	if err != nil {
		return fmt.Errorf("failed to create form file: %w", err)
	}
	if _, err = io.Copy(part, file); err != nil {
		return fmt.Errorf("failed to copy file content to request: %w", err)
	}

	if err = writer.Close(); err != nil {
		return fmt.Errorf("failed to close multipart writer: %w", err)
	}

	req, err := http.NewRequest("POST", apiURL, &requestBody)
	if err != nil {
		return fmt.Errorf("failed to create HTTP request: %w", err)
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{Timeout: time.Second * 120}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send HTTP request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		errorBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("external TTS API returned non-200 status code %d: %s", resp.StatusCode, string(errorBody))
	}

	outputFile, err := os.Create(request.OutputWavPath)
	if err != nil {
		return fmt.Errorf("failed to create output file '%s': %w", request.OutputWavPath, err)
	}
	defer outputFile.Close()

	if _, err = io.Copy(outputFile, resp.Body); err != nil {
		return fmt.Errorf("failed to write audio data to file: %w", err)
	}

	return nil
}

// --- Directory Reading Logic ---

// ReadDirectoryRecursive gets the file paths without modifying filenames
func ReadDirectoryRecursive(rootPath string) ([]FileItem, error) {
	var fileList []FileItem
	err := filepath.Walk(rootPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			return nil
		}

		ext := strings.ToLower(filepath.Ext(path))
		isAudioFile := false
		switch ext {
		case ".mp3", ".wav", ".ogg", ".flac", ".aac", ".m4a", ".wma", ".opus":
			isAudioFile = true
		}
		if !isAudioFile {
			return nil
		}

		relPath, err := filepath.Rel(rootPath, path)
		if err != nil {
			return err
		}

		if relPath == "." {
			return nil
		}

		// The Name for the UI should be prefixed if it's from the output directory.
		uiName := filepath.ToSlash(relPath)
		if filepath.Base(rootPath) == "output" {
			uiName = "output/" + uiName
		}

		absPath, err := filepath.Abs(path)
		if err != nil {
			return err
		}

		fileItem := FileItem{
			Name: uiName,
			Path: absPath,
			URL:  "/api/audio-file/" + uiName,
		}
		fileList = append(fileList, fileItem)
		return nil
	})
	if err != nil {
		return nil, err
	}
	return fileList, nil
}

// SanitizeFilenames sanitizes filenames by removing special characters
func SanitizeFilenames(rootPath string) error {
	err := filepath.Walk(rootPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			return nil
		}

		ext := strings.ToLower(filepath.Ext(path))
		isAudioFile := false
		switch ext {
		case ".mp3", ".wav", ".ogg", ".flac", ".aac", ".m4a", ".wma", ".opus":
			isAudioFile = true
		}
		if !isAudioFile {
			return nil
		}

		relPath, err := filepath.Rel(rootPath, path)
		if err != nil {
			return err
		}

		if relPath == "." {
			return nil
		}

		// Extract base name and sanitize it
		baseName := strings.TrimSuffix(filepath.Base(relPath), ext)
		sanitizedBaseName := RemoveSpecialSymbols(baseName)

		// If the filename changed, rename the file
		if baseName != sanitizedBaseName && sanitizedBaseName != "" {
			// Check for conflicts and add numbers if needed
			newPath := filepath.Join(filepath.Dir(path), sanitizedBaseName+ext)
			counter := 1

			// Check if file already exists and try different names
			for {
				if _, err := os.Stat(newPath); os.IsNotExist(err) {
					// This name is available, break the loop
					break
				} else {
					// Name exists, try with a counter
					filenameWithoutExt := sanitizedBaseName
					newPath = filepath.Join(filepath.Dir(path), fmt.Sprintf("%s_%d%s", filenameWithoutExt, counter, ext))
					counter++

					// Safety check to avoid infinite loops
					if counter > 1000 {
						fmt.Printf("Too many conflicts for base name %s, skipping rename\n", sanitizedBaseName)
						return nil
					}
				}
			}

			// Only rename if the new name is different from the old one
			if path != newPath {
				err := os.Rename(path, newPath)
				if err != nil {
					fmt.Printf("Error renaming file %s to %s: %v\n", path, newPath, err)
					return err
				}
			}
		} else if sanitizedBaseName == "" {
			// If sanitization results in an empty name, we might want to skip this file or use a default name
			// For now, we'll continue with the original name to avoid losing files
			fmt.Printf("Sanitized name is empty for %s, skipping sanitization\n", path)
		}

		return nil
	})
	if err != nil {
		return err
	}
	return nil
}

// GetAudioPath returns the audio path from environment variable AUDIO_PATH
// with a fallback to the default path if the environment variable is not set
func GetAudioPath() string {
	audioPath := os.Getenv("AUDIO_PATH")
	if audioPath == "" {
		audioPath = "/home/zdz/Documents/Try/TTS/audio/audiobook_manager/wav"
	}
	return audioPath
}

// GenerateTTSFilename creates a unique filename based on the TTS request parameters.
func GenerateTTSFilename(request TTSRequest) string {
	// Create a string combining all the request parameters for hashing
	paramsString := fmt.Sprintf("%s|%s|%s|%f|%d", request.Role, request.Text, request.EmotionText, request.EmotionAlpha, request.IntervalSilence)

	fmt.Println("paramsString:", paramsString)
	// Generate MD5 hash of the parameters
	hash := fmt.Sprintf("%x", md5.Sum([]byte(paramsString)))

	// Use the hash as the filename to avoid duplicates
	// speakerBase := strings.TrimSuffix(filepath.Base(request.SpeakerAudioPath), filepath.Ext(request.SpeakerAudioPath))
	return fmt.Sprintf("%s_%s.wav", "1", hash[:8])
}

// RemoveSpecialSymbols removes all special symbols except Chinese/English commas, periods, and ellipses
func RemoveSpecialSymbols(text string) string {
	var result strings.Builder
	for _, r := range text {
		// Keep letters, numbers, spaces, and allowed punctuation
		if (r >= 'a' && r <= 'z') ||
			(r >= 'A' && r <= 'Z') ||
			(r >= '0' && r <= '9') ||
			(r >= '一' && r <= '龯') || // Chinese characters
			r == ' ' || r == '　' || // spaces (regular and full-width)
			r == ',' || r == '.' || r == '!' || r == '?' || // English punctuation
			r == '，' || r == '。' || r == '！' || r == '？' || // Chinese punctuation
			r == '…' { // ellipsis
			result.WriteRune(r)
		}
		// For other special characters, we skip them (don't add to result)
	}
	return result.String()
}
