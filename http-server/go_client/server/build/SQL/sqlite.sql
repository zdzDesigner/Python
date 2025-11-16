-- SQLite3 Table Creation Script for Audio Server


-- Create TTS Records table
CREATE TABLE IF NOT EXISTS tts_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    no INTEGER NOT NULL, -- No (10*n+n)
    book_id INTEGER NOT NULL,
    section_id INTEGER NOT NULL,
    user_id INTEGER DEFAULT 0,
    text TEXT NOT NULL,
    speaker_audio_path TEXT NOT NULL,
    output_wav_path TEXT NOT NULL,
    emotion_text TEXT DEFAULT '',
    emotion_alpha INTEGER DEFAULT 0, -- val/10
    interval_silence INTEGER DEFAULT 0,
    role TEXT DEFAULT '',
    status TEXT DEFAULT 'pending', -- pending, success, error
    error_msg TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for TTS Records table
CREATE UNIQUE INDEX IF NOT EXISTS book_id_section_id_no ON tts_records(book_id,section_id,no);
CREATE INDEX IF NOT EXISTS idx_tts_records_no ON tts_records(no);
CREATE INDEX IF NOT EXISTS idx_tts_records_user_id ON tts_records(user_id);
CREATE INDEX IF NOT EXISTS idx_tts_records_section_id ON tts_records(section_id);
CREATE INDEX IF NOT EXISTS idx_tts_records_status ON tts_records(status);
CREATE INDEX IF NOT EXISTS idx_tts_records_created_at ON tts_records(created_at);
CREATE INDEX IF NOT EXISTS idx_tts_records_output_wav_path ON tts_records(output_wav_path);

-- Create Audio Files table
CREATE TABLE IF NOT EXISTS audio_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    path TEXT NOT NULL,
    url TEXT NOT NULL,
    size INTEGER DEFAULT 0,
    format TEXT DEFAULT '',
    user_id INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for Audio Files table
CREATE INDEX IF NOT EXISTS idx_audio_files_user_id ON audio_files(user_id);
CREATE INDEX IF NOT EXISTS idx_audio_files_format ON audio_files(format);
CREATE INDEX IF NOT EXISTS idx_audio_files_created_at ON audio_files(created_at);

-- Enable foreign key constraints (optional, but recommended)
PRAGMA foreign_keys = ON;

-- Set journal mode to WAL for better concurrency
PRAGMA journal_mode = WAL;

-- Set synchronous mode for better performance
PRAGMA synchronous = NORMAL;



-- Create a trigger to update the updated_at field automatically
CREATE TRIGGER IF NOT EXISTS update_tts_records_updated_at 
AFTER UPDATE ON tts_records
BEGIN
    UPDATE tts_records SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Create a trigger to update the updated_at field automatically for audio_files
CREATE TRIGGER IF NOT EXISTS update_audio_files_updated_at 
AFTER UPDATE ON audio_files
BEGIN
    UPDATE audio_files SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
