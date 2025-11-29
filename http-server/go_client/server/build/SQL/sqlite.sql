-- SQLite3 Table Creation Script for Audio Server

------------------------------------
-- Create TTS Records table
------------------------------------
CREATE TABLE IF NOT EXISTS tts_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER DEFAULT 0,
    book_id INTEGER NOT NULL,
    section_id INTEGER NOT NULL,
    dubbing_id INTEGER DEFAULT 0,
    no INTEGER NOT NULL, -- No (10*n+n)
    role TEXT DEFAULT '',
    text TEXT NOT NULL,
    speaker_audio_path TEXT NOT NULL,
    output_wav_path TEXT NOT NULL,
    emotion_text TEXT DEFAULT '',
    emotion_alpha INTEGER DEFAULT 0, -- val/10
    interval_silence INTEGER DEFAULT 0,
    audio_end_truncate INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending', -- pending, success, error, locked
    error_msg TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for TTS Records table
CREATE UNIQUE INDEX IF NOT EXISTS uni_idx_tts_records_book_id_section_id_no ON tts_records(book_id,section_id,no);
CREATE INDEX IF NOT EXISTS idx_tts_records_no ON tts_records(no);
CREATE INDEX IF NOT EXISTS idx_tts_records_user_id ON tts_records(user_id);
CREATE INDEX IF NOT EXISTS idx_tts_records_section_id ON tts_records(section_id);
CREATE INDEX IF NOT EXISTS idx_tts_records_status ON tts_records(status);
CREATE INDEX IF NOT EXISTS idx_tts_records_created_at ON tts_records(created_at);
CREATE INDEX IF NOT EXISTS idx_tts_records_output_wav_path ON tts_records(output_wav_path);

-- Create a trigger to update the updated_at field automatically
CREATE TRIGGER IF NOT EXISTS update_tts_records_updated_at 
AFTER UPDATE ON tts_records
BEGIN
    UPDATE tts_records SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;



------------------------------------
-- Create Audio Files table
------------------------------------
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

-- Create a trigger to update the updated_at field automatically for audio_files
CREATE TRIGGER IF NOT EXISTS update_audio_files_updated_at 
AFTER UPDATE ON audio_files
BEGIN
    UPDATE audio_files SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;


------------------------------------
-- Create Sections table
------------------------------------
CREATE TABLE IF NOT EXISTS sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    describe TEXT DEFAULT '',
    size INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for Sections table
CREATE INDEX IF NOT EXISTS idx_sections_book_id ON sections(book_id);
CREATE INDEX IF NOT EXISTS idx_sections_created_at ON sections(created_at);

-- Create a trigger to update the updated_at field automatically for sections
CREATE TRIGGER IF NOT EXISTS update_sections_updated_at 
AFTER UPDATE ON sections
BEGIN
    UPDATE sections SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;


------------------------------------
-- books
------------------------------------
CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    describe TEXT DEFAULT '',
    bg TEXT DEFAULT '',
    size INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER IF NOT EXISTS update_books_updated_at 
AFTER UPDATE ON books
BEGIN
    UPDATE books SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;


------------------------------------
-- dubbings
------------------------------------
CREATE TABLE IF NOT EXISTS dubbings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    age_text TEXT DEFAULT '',
    emotion_text TEXT DEFAULT '',
    wav_path TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER IF NOT EXISTS update_dubbings_updated_at 
AFTER UPDATE ON dubbings
BEGIN
    UPDATE dubbings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;


------------------------------------
-- book_dubbings 
------------------------------------
CREATE TABLE IF NOT EXISTS book_dubbings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL,
    dubbing_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_book_dubbing_book_id_dubbing_id ON book_dubbings(book_id,dubbing_id);
CREATE TRIGGER IF NOT EXISTS update_book_dubbings_updated_at 
AFTER UPDATE ON book_dubbings
BEGIN
    UPDATE book_dubbings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;


-- Enable foreign key constraints (optional, but recommended)
PRAGMA foreign_keys = ON;

-- Set journal mode to WAL for better concurrency
PRAGMA journal_mode = WAL;

-- Set synchronous mode for better performance
PRAGMA synchronous = NORMAL;








