# Project Summary

## Overall Goal
Implement and enhance a Go-based HTTP server for TTS (Text-to-Speech) functionality with advanced text processing capabilities, including special character removal and filename sanitization, while maintaining a React-based web frontend with editable table functionality.

## Key Knowledge
- **Technology Stack**: Go server with Gin framework, React frontend with Ant Design components
- **Project Structure**: Server code in `/server/` directory, React frontend in `/web/` directory
- **API Endpoints**: 
  - `/api/audio-files` - list audio files
  - `/api/tts` - TTS synthesis
  - `/api/remove-special-symbols` - text processing
  - `/api/sanitize-filenames` - filename cleanup
- **Key Functions**: 
  - `RemoveSpecialSymbols` - removes special characters while preserving commas, periods, ellipses
  - `ReadDirectoryRecursive` - gets file paths without modification
  - `SanitizeFilenames` - modifies filenames to remove special characters
- **Frontend Components**: TTSList component with editable table columns (speaker, content, tone, intensity, delay)
- **Build Commands**: Server runs on port 8081, client development server

## Recent Actions
- [DONE] Implemented click-to-edit functionality in TTSList table with proper performance optimization
- [DONE] Added editable functionality to 5 columns: "角色" (speaker), "文本内容" (content), "情感" (tone), "情感比重" (intensity), "延迟" (delay)
- [DONE] Added numeric validation for intensity (0-10) and delay (0-5000) columns
- [DONE] Fixed batch training cancellation to properly clear training states when stopped
- [DONE] Added `RemoveSpecialSymbols` function that preserves Chinese/English punctuation
- [DONE] Refactored `ReadDirectoryRecursive` into two separate functions: one for reading paths, one for sanitizing filenames
- [DONE] Added API endpoint `/api/sanitize-filenames` for filename sanitization
- [DONE] Improved file conflict handling with counter-based naming when sanitized names collide

## Current Plan
- [DONE] Implement text processing API for removing special symbols
- [DONE] Create filename sanitization functionality to clean up files with special characters
- [DONE] Refactor directory reading logic into separate functions for better separation of concerns
- [DONE] Add proper error handling and conflict resolution for file renaming
- [TODO] Test all new API endpoints and frontend functionality
- [TODO] Ensure proper integration between frontend and the new sanitization features
- [TODO] Verify the new architecture maintains performance with large audio libraries

---

## Summary Metadata
**Update time**: 2025-11-15T07:16:52.857Z 
