# AGENTS.md

This file provides guidance to Qoder (qoder.com) when working with code in this repository.

## Project Overview
This is an AI audiobook platform that converts text documents into high-quality speech using index-tts technology. The system includes document upload/parsing, text-to-speech conversion, audiobook player, and personalized voice parameter adjustments.

## Key Technical Components
- Backend: Go/Gin server with SQLite database
- Frontend: React-based web interface
- Audio Processing: FFmpeg integration via astiav library
- TTS Engine: External index-tts service at http://127.0.0.1:8800/inference
- Database Models: Sections, TTS Records, Users

## Common Development Commands
- Start backend server: `cd server && go run *.go`
- Build backend: `cd server && go build -o audio-server`
- Run tests: (no standard test suite defined yet)

## Architecture Notes
- Main entry point: server/main.go
- API handlers: server/handlers.go
- Audio processing: server/audio.go
- Database models: server/db/*.go
- All audio files stored in 'output/' directory
- Database file: assets/audio_server.db

## Key API Endpoints
- POST /api/tts - Synthesize speech from text
- POST /api/tts/check - Check if TTS output already exists
- POST /api/audio/joint - Concatenate multiple audio files
- GET /api/audio-files - List available audio files
- CRUD operations for sections (/api/sections) and TTS templates (/api/tts-tpl)

## Important Implementation Details
- Audio concatenation uses FFmpeg via astiav library with proper transcoding
- TTS output filenames are generated using MD5 hashes of parameters
- Section management for organizing audiobooks
- TTS records track synthesis parameters and output paths