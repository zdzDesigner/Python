# Project Summary

## Overall Goal
Implement a React-based audio server web application with TTS capabilities, including ant-design notifications for error handling, TextDataSettings component with upload and manual JSON input capabilities, TTSList component to display JSON data in a table with Chinese labels, optimized file deletion, playback complete event, highlighting of currently playing audio in the file tree, responsive table rendering, and abstracted API services.

## Key Knowledge
- Project uses React with ant-design (antd) for UI components and notifications
- Backend API server runs on http://localhost:8081
- Notification system implemented using antd's notification API with a global NotificationContext
- TextDataSettings component provides both file upload and manual JSON input features for TTS data
- TTSList component displays JSON data in a table with Chinese column headers (角色, 配音, 文本内容, 情感, 情感比重, 延迟, 操作)
- File deletion now updates local state instead of re-fetching data for better performance
- AudioPlayer component includes playback complete event handling
- Currently playing audio file is highlighted in the file tree with light indigo background and left border
- JSON data follows the format: {speaker, content, tone, intensity, delay}
- Component hierarchy includes App, Sidebar, FileTree, AudioPlayer, TextDataSettings, and TTSList components
- API calls have been abstracted to src/service/api/tts.js
- TTSList.jsx has window resize handling for dynamic table height adjustment
- Training functionality in TTSList calls synthesizeTTS with record data mapping: speaker_audio_path from dubbing, text from content, emotion_text from tone, emotion_alpha from intensity, interval_silence from delay
- Each record has a unique key `${record.speaker}-${record.content}` for tracking training state
- Trained records' output paths are stored and used for playback functionality

## Recent Actions
- Updated TTSList.jsx to handle window resize events and dynamically adjust table height
- Created service/api/tts.js file with abstracted API functions (synthesizeTTS, fetchAudioFiles, deleteAudioFile)
- Updated App.jsx to use the new service functions instead of direct API calls
- Updated TTSList.jsx to implement training functionality using the synthesizeTTS function with record data
- Modified synthesizeTTS function to handle both old parameter format (for App.jsx) and new format (for TTSList.jsx)
- Added notification handling to TTSList.jsx for training success/error cases
- Added handleTTSListSynthesize function in App.jsx to handle synthesis completion from TTSList
- Implemented training state tracking with loading indicators in TTSList.jsx
- Added functionality to store trained records' output paths and enable playback
- Implemented playback functionality that uses stored output paths for trained audio files

## Current Plan
- [DONE] Install antd library for UI components and notifications
- [DONE] Create NotificationContext to manage global notifications
- [DONE] Update main.jsx to wrap the app with NotificationProvider
- [DONE] Update App.jsx to use notification context instead of error state
- [DONE] Update Sidebar.jsx to remove old error display
- [DONE] Create TextDataSettings component with upload and manual input features
- [DONE] Integrate TextDataSettings component into the application layout
- [DONE] Create TTSList component to display JSON data in table format
- [DONE] Add Chinese column headers to the TTS table
- [DONE] Add scroll functionality to the TTS table
- [DONE] Optimize file deletion to update local state instead of re-fetching
- [DONE] Add playback complete event to AudioPlayer component
- [DONE] Highlight currently playing audio in the file tree
- [DONE] Update component hierarchy to pass necessary state through props
- [DONE] Add window resize handling to TTSList component
- [DONE] Abstract API calls from App.jsx to service/api/tts.js
- [DONE] Implement training functionality in TTSList.jsx that calls synthesizeTTS with record data
- [DONE] Implement training state tracking with disabled buttons during training
- [DONE] Implement trained records' output path storage and playback functionality

---

## Summary Metadata
**Update time**: 2025-11-09T14:21:26.803Z 
