package db

import (
	"time"
	"go-audio-server/db/sqlite"
)

type Book struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"describe"`
	Bg          string    `json:"bg"`
	Size        int       `json:"size"`
	CreatedAt   time.Time `json:"created_at" sql:"auto"`
	UpdatedAt   time.Time `json:"updated_at" sql:"auto"`
}

func (b *Book) TableName() string { return "books" }

func (b *Book) Add() (sqlite.Ret, error) {
	sqler := sqlite.DB(b)
	return sqler.Ret, sqler.Add("created_at", "updated_at")
}

func (b *Book) Count() int { 
	return sqlite.DB(b).Count() 
}

func (b *Book) Del(val map[string]any) error {
	return sqlite.DB(b).Del(val)
}

func (b *Book) Update(w map[string]any, keys []string) error {
	return sqlite.DB(b).Where(w).Update(keys...)
}

func (b *Book) GetFunc(fn func(*sqlite.Sql) *sqlite.Sql) ([]*Book, error) {
	return sqlite.GetField[Book](func(dbm sqlite.DBSql) *sqlite.Sql { 
		return fn(dbm(b)) 
	})
}

func (b *Book) Get(w any, limit []string, isdesc bool) ([]*Book, error) {
	if limit == nil {
		limit = []string{"1", "10"}
	}
	return sqlite.GetField[Book](func(dbm sqlite.DBSql) *sqlite.Sql {
		if isdesc {
			return dbm(b).Where(w).Page(limit[0], limit[1]).Order("id desc")
		} else {
			return dbm(b).Where(w).Page(limit[0], limit[1]).Order("id asc")
		}
	})
}

// UpdateByID updates a book by its ID
func (b *Book) UpdateByID(id int, keys ...string) error {
	return sqlite.DB(b).Where(map[string]any{"id": id}).Update(keys...)
}
