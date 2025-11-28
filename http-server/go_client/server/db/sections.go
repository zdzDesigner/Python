package db

import (
	"fmt"
	"time"

	"go-audio-server/db/sqlite"
)

type Section struct {
	ID          int       `json:"id"`
	BookId      int       `json:"book_id"`
	Name        string    `json:"name"`
	Description string    `json:"describe"`
	Size        int       `json:"size"`
	CreatedAt   time.Time `json:"created_at" sql:"auto"`
	UpdatedAt   time.Time `json:"updated_at" sql:"auto"`
}

func (s *Section) TableName() string { return "sections" }
func (s *Section) Add() (sqlite.Ret, error) {
	sqler := sqlite.DB(s)
	return sqler.Ret, sqler.Add("created_at", "updated_at")
}
func (s *Section) Count() int { return sqlite.DB(s).Count() }
func (s *Section) Del(val map[string]any) error {
	return sqlite.DB(s).Del(val)
}

func (s *Section) Update(w map[string]any, keys []string) error {
	return sqlite.DB(s).Where(w).Update(keys...)
}

func (s *Section) GetFunc(fn func(*sqlite.Sql) *sqlite.Sql) ([]*Section, error) {
	return sqlite.GetField[Section](func(dbm sqlite.DBSql) *sqlite.Sql { return fn(dbm(s)) })
}

func (s *Section) Get(w any, limit []string, isdesc bool) ([]*Section, error) {
	if limit == nil {
		limit = []string{"1", "1"}
	}
	return sqlite.GetField[Section](func(dbm sqlite.DBSql) *sqlite.Sql {
		if isdesc {
			return dbm(s).Where(w).Page(limit[0], limit[1]).Order("id desc")
		} else {
			return dbm(s).Where(w).Page(limit[0], limit[1]).Order("id asc")
		}
	})
}

// GetByBookID returns sections for a specific book
func (s *Section) GetByBookID(bookID int, limit []string) ([]*Section, error) {
	if limit == nil {
		limit = []string{"1", "20"} // Default to first 20 records
	}
	return sqlite.GetField[Section](func(dbm sqlite.DBSql) *sqlite.Sql {
		return dbm(s).Where(map[string]any{"book_id": bookID}).Page(limit[0], limit[1]).Order("id desc")
	})
}

// UpdateByID updates a section by its ID
func (s *Section) UpdateByID(id int, keys ...string) error {
	fmt.Println("id:", id, keys, *s)
	return sqlite.DB(s).Where(map[string]any{"id": id}).Update(keys...)
}

