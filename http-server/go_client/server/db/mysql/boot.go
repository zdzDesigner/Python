package mysql

import (
	"database/sql"
	"time"

	"github.com/go-sql-driver/mysql"
	"github.com/sirupsen/logrus"
)

var (
	db     *sql.DB
	Tables []string = []string{}
)

func Boot(config map[string]string) {
	var err error
	if db != nil {
		return
	}
	db, err = open(config)
	if err != nil {
		panic(err)
	}

	db.SetMaxOpenConns(20)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(1 * time.Hour)
	if err = db.Ping(); err != nil {
		db.Close()
		panic(err)
	}

	Tables, _ = tables()
}

func open(config map[string]string) (*sql.DB, error) {
	dbOpts := mysql.Config{
		User:                 config["Username"],
		Passwd:               config["Password"],
		Addr:                 config["Addr"],
		DBName:               config["DBName"],
		Net:                  "tcp",
		ParseTime:            true, // time.Time
		Params:               map[string]string{"charset": "utf8"},
		AllowNativePasswords: true,
	}
	logrus.Infof("dbOpts:%s", dbOpts.FormatDSN())
	return sql.Open("mysql", dbOpts.FormatDSN())
}

func mustexec(SQL string) (err error) {
	_, err = db.Exec(SQL)
	return
}

// 创建表
func Create(SQL string) error {
	_, err := db.Exec(SQL)
	if err != nil {
		return err
	}
	Tables, _ = tables()
	return nil
}

// Exec
func Exec(SQL string) error {
	_, err := db.Exec(SQL)
	return err
}

// 事务
func TransactionStart() error { return mustexec("START TRANSACTION;") }

// 提交
func TransactionCommit() error { return mustexec("COMMIT;") }

// 回滚
func TransactionRollback() error { return mustexec("ROLLBACK;") }
