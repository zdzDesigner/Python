package db

import (
	"time"
	"go-audio-server/db/sqlite"
)

type Dubbing struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	Avatar      string    `json:"avatar"`
	AgeText     string    `json:"age_text"`
	EmotionText string    `json:"emotion_text"`
	WavPath     string    `json:"wav_path"`
	CreatedAt   time.Time `json:"created_at" sql:"auto"`
	UpdatedAt   time.Time `json:"updated_at" sql:"auto"`
}

func (d *Dubbing) TableName() string { return "dubbings" }

func (d *Dubbing) Add() (sqlite.Ret, error) {
	sqler := sqlite.DB(d)
	return sqler.Ret, sqler.Add("created_at", "updated_at")
}

func (d *Dubbing) Count() int { 
	return sqlite.DB(d).Count() 
}

func (d *Dubbing) Del(val map[string]any) error {
	return sqlite.DB(d).Del(val)
}

func (d *Dubbing) Update(w map[string]any, keys []string) error {
	return sqlite.DB(d).Where(w).Update(keys...)
}

func (d *Dubbing) GetFunc(fn func(*sqlite.Sql) *sqlite.Sql) ([]*Dubbing, error) {
	return sqlite.GetField[Dubbing](func(dbm sqlite.DBSql) *sqlite.Sql { 
		return fn(dbm(d)) 
	})
}

func (d *Dubbing) Get(w any, limit []string, isdesc bool) ([]*Dubbing, error) {
	if limit == nil {
		limit = []string{"1", "1"}
	}
	return sqlite.GetField[Dubbing](func(dbm sqlite.DBSql) *sqlite.Sql {
		if isdesc {
			return dbm(d).Where(w).Page(limit[0], limit[1]).Order("id desc")
		} else {
			return dbm(d).Where(w).Page(limit[0], limit[1]).Order("id asc")
		}
	})
}

// UpdateByID updates a dubbing by its ID
func (d *Dubbing) UpdateByID(id int, keys ...string) error {
	return sqlite.DB(d).Where(map[string]any{"id": id}).Update(keys...)
}