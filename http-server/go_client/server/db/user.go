package db

import (
	"go-audio-server/db/mysql"
	"time"
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

/*
mysql> show full columns from user;
+------------+--------------+--------------------+------+-----+---------------------+----------------------------+
| Field      | Type         | Collation          | Null | Key | Default             | Comment                    |
+------------+--------------+--------------------+------+-----+---------------------+----------------------------+
| id         | int(11)      | NULL               | NO   | PRI | NULL                |                            |
| username   | varchar(255) | utf8mb3_general_ci | NO   | MUL | NULL                | 用户名                     |
| password   | varchar(255) | utf8mb3_general_ci | NO   |     | NULL                | 密码                       |
| usertype   | tinyint(4)   | NULL               | NO   |     | NULL                | 0:管理员,1:普通用户        |
| phone      | char(11)     | utf8mb3_general_ci | YES  |     | NULL                | 电话                       |
| descr      | char(11)     | utf8mb3_general_ci | NO   |     |                     | 描述                       |
| createtime | timestamp    | NULL               | YES  |     | current_timestamp() | 创建时间                   |
| updatetime | timestamp    | NULL               | YES  |     | current_timestamp() | 更新时间                   |
+------------+--------------+--------------------+------+-----+---------------------+----------------------------+
7 rows in set (0.001 sec)
*/

func (u *User) TabelName() string            { return "user" }
func (u *User) Add() error                   { return mysql.DB(u).Add("createtime", "updatetime") }
func (u *User) Count() int                   { return mysql.DB(u).Count() }
func (u *User) Del(val map[string]any) error { return mysql.DB(u).Del(val) }
func (u *User) Update(w map[string]any, keys []string) error {
	// keys = append(keys, "updatetime")
	return mysql.DB(u).Where(w).Update(keys...)
}

func (u *User) Get(w any, limit []string) ([]*User, error) {
	if limit == nil {
		limit = []string{"1", "1"}
	}
	return mysql.GetField[User](func(dbm mysql.DBSql) *mysql.Sql {
		return dbm(u).Where(w).Page(limit[0], limit[1]).Order("id desc")
	})
}
