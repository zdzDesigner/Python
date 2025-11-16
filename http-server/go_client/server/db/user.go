package db

import (
	"time"

	"go-audio-server/db/sqlite"
)

type User struct {
	ID         int       `json:"id"`
	Usertype   int       `json:"usertype"`
	Username   string    `json:"username"`
	Password   string    `json:"password"`
	Phone      string    `json:"phone"`
	Descr      string    `json:"descr"`
	Createtime time.Time `json:"createtime" sql:"auto"`
	Updatetime time.Time `json:"updatetime" sql:"auto"`
}


func (u *User) TabelName() string            { return "user" }
func (u *User) Add() error                   { return sqlite.DB(u).Add("createtime", "updatetime") }
func (u *User) Count() int                   { return sqlite.DB(u).Count() }
func (u *User) Del(val map[string]any) error { return sqlite.DB(u).Del(val) }
func (u *User) Update(w map[string]any, keys []string) error {
	// keys = append(keys, "updatetime")
	return sqlite.DB(u).Where(w).Update(keys...)
}

func (u *User) Get(w any, limit []string) ([]*User, error) {
	if limit == nil {
		limit = []string{"1", "1"}
	}
	return sqlite.GetField[User](func(dbm sqlite.DBSql) *sqlite.Sql {
		return dbm(u).Where(w).Page(limit[0], limit[1]).Order("id desc")
	})
}
