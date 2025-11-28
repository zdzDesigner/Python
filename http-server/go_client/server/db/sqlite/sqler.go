package sqlite

import (
	"database/sql"
	"errors"
	"fmt"
	"reflect"
	"strconv"
	"strings"
	"time"

	"github.com/samber/lo"
	"github.com/sirupsen/logrus"
)

// Dber 定义数据库执行接口
type Dber interface {
	Exec(string, ...any) (sql.Result, error)
	Query(string, ...any) (*sql.Rows, error)
}

// TableNamer 接口用于自定义表名
type TableNamer interface {
	TableName() string
}

// TableIgnoreKeyer 接口用于忽略键
type TableIgnoreKeyer interface {
	TableIgnoreKey() []string
}

// Dynamicer 接口用于动态扩展字段
type Dynamicer interface {
	ExpandNew() Expand
}

// Interceptor 接口用于执行前钩子
type Interceptor interface {
	Intercept()
}

// SearchHook 类型定义搜索钩子
type SearchHook func(s *Sql) *Sql

// Expand 类型定义动态字段映射
type Expand map[string]any

// Field 为 Expand 添加缺失字段默认值
func (e Expand) Field(structkeys []string, columns []Column) Expand {
	if len(e) == 0 {
		for _, column := range columns {
			if !lo.Contains(structkeys, column.Field) {
				e[column.Field] = FieldType(column.Type)
			}
		}
	}
	return e
}

// ExpandNew 初始化或返回 Expand
func ExpandNew(expand *Expand) *Expand {
	if *expand == nil {
		*expand = make(Expand)
	}
	return expand
}

// FieldType 根据列类型返回默认值
func FieldType(key string) any {
	val := map[string]any{
		"INTEGER":       new(int),
		"TEXT":          new(string),
		"REAL":          new(float64),
		"NUMERIC":       new(float64),
		"BOOLEAN":       new(bool),
		"DATETIME":      new(time.Time),
		"TIMESTAMP":     new(time.Time),
		"int":           new(int),
		"varchar":       new(string),
		"int(11)":       new(int),
		"varchar(255)":  new(string),
		"varchar(8126)": new(string),
		"varchar(1024)": new(string),
	}
	if v, ok := val[key]; ok {
		return v
	}
	return nil
}

// Ret 存储执行结果
type Ret struct {
	Id  int
	Num int
}

// Sql 核心 SQL 构建结构体
type Sql struct {
	DB             Dber
	t_name         string
	pri_keys       []string
	t_keys         []string
	w_keys         []string
	i_keys         []string
	w_vals         []any
	kv             map[string]any
	expand_columns []Column
	order          string
	limit          string
	in             string
	between        string
	wraw           string
	groupby        string
	Ret            Ret
}

// ScanKeys 扫描并排序键
func (s *Sql) ScanKeys(keys ...string) []string {
	if len(keys) == 0 {
		return s.t_keys
	}
	sortkeys := make([]string, 0, len(s.t_keys))
	for _, key := range s.t_keys {
		if lo.Contains[string](keys, key) {
			sortkeys = append(sortkeys, key)
		}
	}
	return sortkeys
}

// Model 通过反射解析模型
func (s *Sql) Model(p any) *Sql {
	s.kv = make(map[string]any)
	rt := reflect.TypeOf(p)
	rv := reflect.ValueOf(p)
	if rt.Kind() == reflect.Ptr {
		rt = rt.Elem()
		rv = rv.Elem()
	}
	// 表名
	if pt, ok := p.(TableNamer); ok {
		s.t_name = pt.TableName()
	} else {
		s.t_name = strings.ToLower(rt.Name())
	}
	// 忽略键
	if pt, ok := p.(TableIgnoreKeyer); ok {
		s.i_keys = pt.TableIgnoreKey()
	} else {
		s.i_keys = []string{}
	}
	// 钩子
	if pi, ok := p.(Interceptor); ok {
		pi.Intercept()
	}
	columns, _ := TableColumn(s.t_name)
	s.expand_columns = columns
	s.t_keys = make([]string, 0, len(columns))
	s.pri_keys = []string{"id"}
	n := rt.NumField()
	for i := 0; i < n; i++ {
		t := rt.Field(i)
		v := rv.Field(i)
		if v.CanInterface() {
			tag := t.Tag.Get("json")
			if tag != "" {
				s.t_keys = append(s.t_keys, tag)
				s.kv[tag] = v.Interface()
			}
		}
	}
	// 动态扩展
	if pm, ok := p.(Dynamicer); ok {
		structkeys := append(append([]string{}, s.t_keys...), s.pri_keys...)
		expand := pm.ExpandNew().Field(structkeys, columns)
		for k, v := range expand {
			s.t_keys = append(s.t_keys, k)
			s.kv[k] = v
		}
	}
	return s
}

// RawSQL 执行原始 SQL
func (s *Sql) RawSQL(SQL string, f func(*sql.Rows) error, keys ...any) error {
	DEBUG.Println("SQL:", SQL)
	return s.getraw(SQL, f, keys...)
}

// Raw 执行带参数的原始 SQL
func (s *Sql) Raw(SQL string, f func(*sql.Rows) error) error {
	return s.getraw(SQL, f, s.w_vals...)
}

// Exec 执行 SQL
func (s *Sql) Exec(SQL string) error {
	_, err := s.DB.Exec(SQL)
	return err
}

// Add 插入单条记录
func (s *Sql) Add(ignorekeys ...string) error {
	n := len(s.t_keys) - len(s.pri_keys)
	keys := make([]string, 0, n)
	tpls := make([]string, 0, n)
	vals := make([]any, 0, n)
	for _, k := range s.t_keys {
		if !lo.Contains(s.pri_keys, k) && !lo.Contains(ignorekeys, k) {
			keys = append(keys, k)
			tpls = append(tpls, "?")
			vals = append(vals, s.kv[k])
		}
	}
	keyStr := strings.Join(s.f_t_keys(keys...), ",")
	tplStr := strings.Join(tpls, ",")
	SQL := fmt.Sprintf("INSERT INTO %s (%s) VALUES (%s)", s.t_name, keyStr, tplStr)
	DEBUG.Println(SQL, vals)
	ret, err := s.DB.Exec(SQL, vals...)
	if err != nil {
		return err
	}
	id, _ := ret.LastInsertId()
	num, _ := ret.RowsAffected()
	s.Ret = Ret{Id: int(id), Num: int(num)}
	return nil
}

// AddList 批量插入
func (s *Sql) AddList(p any, ignorekeys ...string) error {
	rt := reflect.TypeOf(p)
	rv := reflect.ValueOf(p)
	if rv.Len() == 0 {
		return nil
	}
	if rt.Kind() != reflect.Slice {
		return errors.New("kind not slice")
	}
	keys := make([]string, 0, len(s.t_keys))
	tpls := make([]string, 0, rv.Len())
	vals := make([]any, 0, rv.Len()*len(s.t_keys))
	for i := 0; i < rv.Len(); i++ {
		item := rv.Index(i)
		if item.Kind() == reflect.Ptr && item.IsNil() {
			panic(fmt.Sprintf("下标%d:参数错误!", i))
		}
		kvs := s.reflect(item.Interface())
		val := make([]string, 0, len(s.t_keys))
		for _, k := range s.t_keys {
			if !lo.Contains(s.pri_keys, k) && !lo.Contains(ignorekeys, k) {
				if i == 0 {
					keys = append(keys, k)
				}
				val = append(val, "?")
				vals = append(vals, kvs[k])
			}
		}
		tpls = append(tpls, fmt.Sprintf("(%s)", strings.Join(val, ",")))
	}
	keyStr := strings.Join(s.f_t_keys(keys...), ",")
	tplStr := strings.Join(tpls, ",")
	SQL := fmt.Sprintf("INSERT INTO %s (%s) VALUES %s", s.t_name, keyStr, tplStr)
	DEBUG.Println(SQL, vals)
	_, err := s.DB.Exec(SQL, vals...)
	return err
}

// GetRaw 执行原始键查询
func (s *Sql) GetRaw(keys string, f func(*sql.Rows) error) error {
	SQL := s.sqlmount(fmt.Sprintf("SELECT %s FROM %s", keys, s.t_name))
	return s.getraw(SQL, f, s.w_vals...)
}

// Get 执行查询
func (s *Sql) Get(f func(*sql.Rows) error, keys ...string) error {
	keyStr := strings.Join(s.f_t_keys(keys...), ",")
	SQL := s.sqlmount(fmt.Sprintf("SELECT %s FROM %s", keyStr, s.t_name))
	DEBUG.Println("SQL:", SQL, s.w_vals)
	return s.getraw(SQL, f, s.w_vals...)
}

// getraw 内部查询执行
func (s *Sql) getraw(SQL string, f func(*sql.Rows) error, vals ...any) error {
	return Query(SQL, f, vals...)
}

// Del 删除记录
func (s *Sql) Del(kv map[string]any) error {
	if len(s.w_keys) == 0 {
		s.Where(kv)
	}
	SQL := s.sqlmount(fmt.Sprintf("DELETE FROM %s", s.t_name))
	_, err := s.DB.Exec(SQL, s.w_vals...)
	return err
}

// Update 更新别名
func (s *Sql) Update(keys ...string) error { return s.Edt(keys...) }

// Edt 更新记录
func (s *Sql) Edt(keys ...string) error {
	sets := make([]string, 0, len(s.t_keys))
	vals := make([]any, 0, len(s.t_keys))
	for _, k := range s.t_keys {
		if !lo.Contains(s.w_keys, k) && !lo.Contains(s.i_keys, k) {
			if len(keys) > 0 && !lo.Contains(keys, k) {
				continue
			}
			sets = append(sets, fmt.Sprintf("%s=?", k))
			vals = append(vals, s.kv[k])
		}
	}
	setStr := strings.Join(sets, ",")
	SQL := s.sqlmount(fmt.Sprintf("UPDATE %s SET %s", s.t_name, setStr))
	allVals := append(vals, s.w_vals...)
	DEBUG.Println(SQL, allVals)
	res, err := s.DB.Exec(SQL, allVals...)
	n, err := res.RowsAffected()
	if 0 == n {
		return errors.New("SQL error:" + SQL)
	}
	return err
}

// Where 设置 WHERE 条件
func (s *Sql) Where(kv any, args ...any) *Sql {
	if newKV, ok := kv.(map[string]any); ok {
		s.w_keys = make([]string, 0, len(newKV))
		s.w_vals = make([]any, 0, len(newKV))
		for k, v := range newKV {
			if vv, ok := v.(string); ok && vv == "" {
				continue
			}
			s.w_keys = append(s.w_keys, k)
			s.w_vals = append(s.w_vals, v)
		}
	} else if key, ok := kv.(string); ok {
		s.wraw = key
	}
	return s
}

// MaxID 获取最大 ID
func (s *Sql) MaxID(f func(*sql.Rows) error) error {
	return s.MaxField("id", f)
}

// MaxField 获取字段最大值
func (s *Sql) MaxField(field string, f func(*sql.Rows) error) error {
	SQL := s.sqlmount(fmt.Sprintf("SELECT max(%s) from %s", field, s.t_name))
	return s.Raw(SQL, f)
}

// Order 设置排序
func (s *Sql) Order(sqlOrder string) *Sql {
	s.order = sqlOrder
	return s
}

// Between 设置 BETWEEN 条件
func (s *Sql) Between(between map[string][]string) *Sql {
	betweenSql := make([]string, 0, len(between))
	for k, v := range between {
		if len(v) < 2 || v[0] == "" || v[1] == "" {
			continue
		}
		betweenSql = append(betweenSql, fmt.Sprintf("%s between %s and %s", k, v[0], v[1]))
	}
	if len(betweenSql) > 0 {
		s.between = strings.Join(betweenSql, " AND ")
	}
	return s
}

// IN 设置 IN 条件
func (s *Sql) IN(key string, ins []string) *Sql {
	newins := make([]string, 0, len(ins))
	for _, item := range ins {
		if item != "" {
			newins = append(newins, fmt.Sprintf("'%s'", item))
		}
	}
	if len(newins) > 0 {
		s.in = fmt.Sprintf("%s in (%s)", key, strings.Join(newins, ","))
	}
	return s
}

// WRaw 设置原始 WHERE
func (s *Sql) WRaw(raw string) *Sql {
	DEBUG.Printf("where raw:%s\n", raw)
	if raw != "" {
		s.wraw = raw
	}
	return s
}

// Page 设置分页
func (s *Sql) Page(page string, size string) *Sql {
	int_page := ToInt(page)
	int_size := ToInt(size)
	if int_page > 0 && int_size > 0 {
		s.limit = fmt.Sprintf("%d,%d", (int_page-1)*int_size, int_size)
	}
	return s
}

// ToLimit 计算 LIMIT 参数
func ToLimit(pagestr, sizestr string) []string {
	page := ToInt(pagestr)
	size := ToInt(sizestr)
	begin := (page - 1) * size
	end := page * size
	return []string{strconv.Itoa(begin), strconv.Itoa(end)}
}

// Limit 设置 LIMIT
func (s *Sql) Limit(limitPair []string) *Sql {
	newlimitPair := make([]string, 0, len(limitPair))
	for _, item := range limitPair {
		if item != "" {
			newlimitPair = append(newlimitPair, item)
		}
	}
	if len(newlimitPair) > 0 {
		s.limit = strings.Join(newlimitPair, ",")
	}
	return s
}

// GroupBy 设置 GROUP BY
func (s *Sql) GroupBy(sqlGroupBy string) *Sql {
	s.groupby = sqlGroupBy
	return s
}

// sqlmount 组装完整 SQL
func (s *Sql) sqlmount(sqltpl string) string {
	var sb strings.Builder
	sb.WriteString(sqltpl)

	// WHERE 条件
	if len(s.w_keys) > 0 {
		wkeys := make([]string, 0, len(s.w_keys))
		for _, k := range s.w_keys {
			wkeys = append(wkeys, fmt.Sprintf("%s=?", k))
		}
		sb.WriteString(fmt.Sprintf(" WHERE %s", strings.Join(wkeys, " AND ")))
	}
	addCondition := func(cond string) {
		if cond != "" {
			if strings.Contains(sb.String(), "WHERE") {
				sb.WriteString(fmt.Sprintf(" AND %s", cond))
			} else {
				sb.WriteString(fmt.Sprintf(" WHERE %s", cond))
			}
		}
	}
	addCondition(s.wraw)
	addCondition(s.between)
	addCondition(s.in)

	if s.order != "" {
		sb.WriteString(fmt.Sprintf(" ORDER BY %s", s.order))
	}
	if s.groupby != "" {
		sb.WriteString(fmt.Sprintf(" GROUP BY %s", s.groupby))
	}
	if s.limit != "" {
		sb.WriteString(fmt.Sprintf(" LIMIT %s", s.limit))
	}
	return sb.String()
}

// f_t_keys 格式化表键
func (s *Sql) f_t_keys(keys ...string) []string {
	retkeys := make([]string, 0, len(s.t_keys))
	if len(keys) == 0 {
		keys = s.t_keys
	}
	for _, k := range keys {
		retkeys = append(retkeys, k) // SQLite doesn't need backticks like MySQL
	}
	return retkeys
}

// reflect 反射结构体到 map
func (s *Sql) reflect(p any) map[string]any {
	rt := reflect.TypeOf(p)
	rv := reflect.ValueOf(p)
	if rt.Kind() == reflect.Ptr {
		rt = rt.Elem()
		rv = rv.Elem()
	}
	n := rt.NumField()
	ret := make(map[string]any, n)
	for i := 0; i < n; i++ {
		t := rt.Field(i)
		v := rv.Field(i)
		if v.CanInterface() {
			k := t.Tag.Get("json")
			if k != "" {
				ret[k] = v.Interface()
			}
		}
	}
	return ret
}

// Count 获取记录数
func (s *Sql) Count(keys ...string) int {
	SQL := s.sqlmount(fmt.Sprintf("SELECT COUNT(*) FROM %s", s.t_name))
	list, err := quick(SQL)
	if err == nil && len(list) > 0 {
		return ToInt(list[0])
	}
	return 0
}

// DBSql 类型定义
type DBSql func(...any) *Sql

// DBMidSql 类型定义
type DBMidSql func(DBSql) *Sql

// Query 通用查询执行
func Query(SQL string, f func(*sql.Rows) error, vals ...any) error {
	rows, err := db.Query(SQL, vals...)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		if rows.Err() != nil {
			return rows.Err()
		}
		if err := f(rows); err != nil {
			logrus.Errorf("Query err: %+v", err)
			continue
		}
	}
	return rows.Err()
}

// quick 快速单值查询
func quick(SQL string) ([]string, error) {
	var list []string
	err := Query(SQL, func(rows *sql.Rows) error {
		var str string
		if err := rows.Scan(&str); err != nil {
			return err
		}
		list = append(list, str)
		return nil
	})
	return list, err
}

// QueryField 泛型字段查询
func QueryField[T any](SQL string, keys ...string) ([]*T, error) {
	var list []*T
	err := Query(SQL, func(rows *sql.Rows) error {
		item := new(T)
		if err := rows.Scan(ScanStructField(item, keys)...); err != nil {
			return err
		}
		list = append(list, item)
		return nil
	})
	return list, err
}

// Column 表列结构
type Column struct {
	Field   string
	Type    string
	Comment string
}

// ACTION 表操作类型
type ACTION int

const (
	ACTION_IGNORE ACTION = iota
	ACTION_ADD
	ACTION_MODIFY
	ACTION_DROP
)

// Action 判断字段操作
func Action(columns []Column, field string, fieldtype string) ACTION {
	for _, item := range columns {
		if item.Field == field {
			if item.Type == fieldtype {
				return ACTION_IGNORE
			}
			return ACTION_MODIFY
		}
	}
	return ACTION_ADD
}

// TableColumn 获取表列
func TableColumn(tname string) ([]Column, error) {
	var list []Column
	SQL := fmt.Sprintf("PRAGMA table_info(%s)", tname)
	err := Query(SQL, func(rows *sql.Rows) error {
		var cid, notnull, pk int
		var name, dtype string
		var dflt_value *string

		if err := rows.Scan(&cid, &name, &dtype, &notnull, &dflt_value, &pk); err != nil {
			return err
		}

		col := Column{
			Field:   name,
			Type:    dtype,
			Comment: "", // SQLite doesn't have column comments in the same way
		}
		list = append(list, col)
		return nil
	})
	return list, err
}

// TableStatistics 获取表统计
func TableStatistics(tname string, keys []string) ([]string, error) {
	keystr := strings.Join(lo.Map(keys, func(k string, _ int) string { return fmt.Sprintf("`%s`", k) }), ",")
	SQL := fmt.Sprintf("SELECT %s FROM pragma_table_info('%s')", keystr, tname)
	return quick(SQL)
}

// IndexField 索引字段
type IndexField struct {
	KeyName string `json:"Key_name"`
}

// TableIndexs 获取表索引
func TableIndexs(tname string) ([]IndexField, error) {
	var list []IndexField
	SQL := fmt.Sprintf("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='%s'", tname)
	err := Query(SQL, func(rows *sql.Rows) error {
		var col IndexField
		if err := rows.Scan(&col.KeyName); err != nil {
			return err
		}
		list = append(list, col)
		return nil
	})
	return list, err
}

// tables 获取所有表
func tables() ([]string, error) {
	return quick("SELECT name FROM sqlite_master WHERE type='table'")
}

// count 获取表记录数
func count(tname string) ([]string, error) {
	return quick(fmt.Sprintf("SELECT COUNT(*) FROM %s", tname))
}

// Lastid 获取最后插入 ID
func Lastid() ([]string, error) {
	var lastId int64
	err := db.QueryRow("SELECT last_insert_rowid()").Scan(&lastId)
	if err != nil {
		return []string{}, err
	}
	return []string{fmt.Sprintf("%d", lastId)}, nil
}

// ScanStructField 扫描结构体字段
func ScanStructField(tb any, keys []string) []any {
	vals := make([]any, 0, len(keys))
	rt := reflect.TypeOf(tb)
	rv := reflect.ValueOf(tb)
	if rt.Kind() == reflect.Ptr {
		rt = rt.Elem()
		rv = rv.Elem()
	}
	structvals := make(map[string]any, rt.NumField())
	for i := 0; i < rt.NumField(); i++ {
		t := rt.Field(i)
		v := rv.Field(i)
		tag := t.Tag.Get("json")
		if lo.Contains[string](keys, tag) {
			structvals[tag] = v.Addr().Interface()
		}
	}
	for _, key := range keys {
		if v, ok := structvals[key]; ok {
			vals = append(vals, v)
		}
	}
	return vals
}

// FieldFilter 过滤字段（带扩展）
func FieldFilter(s *Sql, tb any, keys []string) []any {
	vals := make([]any, 0, len(keys))
	rt := reflect.TypeOf(tb)
	rv := reflect.ValueOf(tb)
	if rt.Kind() == reflect.Ptr {
		rt = rt.Elem()
		rv = rv.Elem()
	}
	structvals := make(map[string]any, rt.NumField())
	for i := 0; i < rt.NumField(); i++ {
		t := rt.Field(i)
		v := rv.Field(i)
		tag := t.Tag.Get("json")
		if lo.Contains[string](keys, tag) {
			structvals[tag] = v.Addr().Interface()
		}
	}
	// 扩展
	if pm, ok := tb.(Dynamicer); ok {
		expand := pm.ExpandNew().Field(MapKeys(structvals), s.expand_columns)
		for _, key := range keys {
			if v, ok := structvals[key]; ok {
				vals = append(vals, v)
				continue
			}
			if ev, ok := expand[key]; ok {
				vals = append(vals, ev)
			}
		}
	} else {
		for _, key := range keys {
			if v, ok := structvals[key]; ok {
				vals = append(vals, v)
			}
		}
	}
	return vals
}

// RawField 原始 SQL 泛型查询
func RawField[T any](dbm DBMidSql, SQL string, keys ...string) ([]*T, error) {
	s := dbm(DB)
	keys = s.ScanKeys(keys...)
	var list []*T
	err := s.RawSQL(SQL, func(rows *sql.Rows) error {
		item := new(T)
		if err := rows.Scan(FieldFilter(s, item, keys)...); err != nil {
			return err
		}
		list = append(list, item)
		return nil
	})
	return list, err
}

// GetField 泛型 Get 查询
func GetField[T any](dbm DBMidSql, keys ...string) ([]*T, error) {
	s := dbm(DB)
	keys = s.ScanKeys(keys...)
	var list []*T
	err := s.Get(func(rows *sql.Rows) error {
		item := new(T)
		if err := rows.Scan(FieldFilter(s, item, keys)...); err != nil {
			return err
		}
		list = append(list, item)
		return nil
	}, keys...)
	return list, err
}

// DB 创建 Sql 实例
func DB(p ...any) *Sql {
	if len(p) > 0 {
		return (&Sql{DB: db}).Model(p[0])
	}
	return &Sql{DB: db}
}
