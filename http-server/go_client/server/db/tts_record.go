package db

import (
	"time"

	"go-audio-server/db/sqlite"
)

type TTSRecord struct {
	ID               int       `json:"id"`
	UserID           int       `json:"user_id"`
	SectionId        int       `json:"section_id"`
	No               int       `json:"no"` // No (10*n+n)
	Text             string    `json:"text"`
	SpeakerAudioPath string    `json:"speaker_audio_path"`
	OutputWavPath    string    `json:"output_wav_path"`
	EmotionText      string    `json:"emotion_text,omitempty"`
	EmotionAlpha     int       `json:"emotion_alpha,omitempty"` // val/10
	IntervalSilence  int       `json:"interval_silence,omitempty"`
	Role             string    `json:"role,omitempty"`
	Status           string    `json:"status"` // pending, success, error
	ErrorMsg         string    `json:"error_msg,omitempty"`
	CreatedAt        time.Time `json:"created_at" sql:"auto"`
	UpdatedAt        time.Time `json:"updated_at" sql:"auto"`
}

func (t *TTSRecord) TableName() string { return "tts_records" }
func (t *TTSRecord) Add() error        { return sqlite.DB(t).Add("created_at", "updated_at") }
func (t *TTSRecord) Count() int        { return sqlite.DB(t).Count() }
func (t *TTSRecord) Del(val map[string]any) error {
	return sqlite.DB(t).Del(val)
}

func (t *TTSRecord) Update(w map[string]any, keys []string) error {
	return sqlite.DB(t).Where(w).Update(keys...)
}

func (t *TTSRecord) Get(w any, limit []string) ([]*TTSRecord, error) {
	if limit == nil {
		limit = []string{"1", "1"}
	}
	return sqlite.GetField[TTSRecord](func(dbm sqlite.DBSql) *sqlite.Sql {
		return dbm(t).Where(w).Page(limit[0], limit[1]).Order("id desc")
	})
}

// GetByUserID returns TTS records for a specific user
func (t *TTSRecord) GetByUserID(userID int, limit []string) ([]*TTSRecord, error) {
	if limit == nil {
		limit = []string{"1", "20"} // Default to first 20 records
	}
	return sqlite.GetField[TTSRecord](func(dbm sqlite.DBSql) *sqlite.Sql {
		return dbm(t).Where(map[string]any{"user_id": userID}).Page(limit[0], limit[1]).Order("id desc")
	})
}

// GetByStatus returns TTS records with a specific status
func (t *TTSRecord) GetByStatus(status string, limit []string) ([]*TTSRecord, error) {
	if limit == nil {
		limit = []string{"1", "20"} // Default to first 20 records
	}
	return sqlite.GetField[TTSRecord](func(dbm sqlite.DBSql) *sqlite.Sql {
		return dbm(t).Where(map[string]any{"status": status}).Page(limit[0], limit[1]).Order("id desc")
	})
}

// GetByOutputPath returns a TTS record by its output path
func (t *TTSRecord) GetByOutputPath(outputPath string) ([]*TTSRecord, error) {
	return sqlite.GetField[TTSRecord](func(dbm sqlite.DBSql) *sqlite.Sql {
		return dbm(t).Where(map[string]any{"output_wav_path": outputPath}).Limit([]string{"0", "1"}).Order("id desc")
	})
}
