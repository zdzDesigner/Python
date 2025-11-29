package db

import (
	"time"
	"go-audio-server/db/sqlite"
)

type BookDubbing struct {
	ID        int       `json:"id"`
	BookId    int       `json:"book_id"`
	DubbingId int       `json:"dubbing_id"`
	CreatedAt time.Time `json:"created_at" sql:"auto"`
	UpdatedAt time.Time `json:"updated_at" sql:"auto"`
}

func (bd *BookDubbing) TableName() string { return "book_dubbings" }

func (bd *BookDubbing) Add() (sqlite.Ret, error) {
	sqler := sqlite.DB(bd)
	return sqler.Ret, sqler.Add("created_at", "updated_at")
}

func (bd *BookDubbing) Count() int { 
	return sqlite.DB(bd).Count() 
}

func (bd *BookDubbing) Del(val map[string]any) error {
	return sqlite.DB(bd).Del(val)
}

func (bd *BookDubbing) Update(w map[string]any, keys []string) error {
	return sqlite.DB(bd).Where(w).Update(keys...)
}

func (bd *BookDubbing) GetFunc(fn func(*sqlite.Sql) *sqlite.Sql) ([]*BookDubbing, error) {
	return sqlite.GetField[BookDubbing](func(dbm sqlite.DBSql) *sqlite.Sql { 
		return fn(dbm(bd)) 
	})
}

func (bd *BookDubbing) Get(w any, limit []string, isdesc bool) ([]*BookDubbing, error) {
	if limit == nil {
		limit = []string{"1", "1"}
	}
	return sqlite.GetField[BookDubbing](func(dbm sqlite.DBSql) *sqlite.Sql {
		if isdesc {
			return dbm(bd).Where(w).Page(limit[0], limit[1]).Order("id desc")
		} else {
			return dbm(bd).Where(w).Page(limit[0], limit[1]).Order("id asc")
		}
	})
}

// UpdateByID updates a book_dubbing by its ID
func (bd *BookDubbing) UpdateByID(id int, keys ...string) error {
	return sqlite.DB(bd).Where(map[string]any{"id": id}).Update(keys...)
}