package sqlite

import (
	"encoding/json"
	"reflect"
	"strconv"
)

func MapKeys[T string | int](m map[T]any) []T {
	keys := make([]T, 0, len(m))
	for k, _ := range m {
		keys = append(keys, k)
	}
	return keys
}

func ToInt(arg any) (d int) {
	if arg != nil {
		tmp := reflect.ValueOf(arg).Interface()

		switch v := tmp.(type) {
		case json.Number:
			n, err := v.Float64()
			if err != nil {
				d = 0
			} else {
				d = int(n)
			}
		case string:
			d, _ = strconv.Atoi(v)
		case float64:
			d = int(v)
		case float32:
			d = int(v)
		case int:
			d = v
		}
	}
	return d
}