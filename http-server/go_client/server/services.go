package main

import (
	"bytes"
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
		if err := writer.WriteField("emo_alpha", fmt.Sprintf("%.2f", request.EmotionAlpha)); err != nil {
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
