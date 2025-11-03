d = {'Michael': 95, 'Bob': 75, 'Tracy': 85}
a = ['ss', 'dd', 3]
print(d)
print(d['Michael'])  # 95
# 可迭代: __getitem__
print("Bob" in d)  # True
print("aa" in d)  # False
for k in d:
    print(k, d[k])

# 获取不存在的元素
try:
    print(d["aa"])
except Exception as err:
    print('try err:', err)

print(d.get("aa"))  # None
print('xxxx', d.get("Bob"))  # None
if (d.get("aa")):
    print('不会有异常, 不显示')


print(d.get("aa") is None)  # True
print(d.get("aa", "ff"))  # ff 指定默认值

d["v"] = "vvvvvvvvvvv"

# 删除
d.pop("Bob")  # 删除 Bob
print(d)  # {'Michael': 95, 'Tracy': 85, 'v': 'vvvvvvvvvvv'}

del d['Tracy']
print(d)  # {'Michael': 95, 'v': 'vvvvvvvvvvv'}

print(dict.keys(d))  # dict_keys(['Michael', 'v'])


# dict keys 类型
print(type(dict.keys(d)))  # <class 'dict_keys'>

print(dict.values(d))  # dict_values([95, 'vvvvvvvvvvv'])

# dict values 类型
print(type(dict.values(d)))  # <class 'dict_values'>

# 迭代器
vals = iter(dict.values(d))
print(vals.__next__())  # 95
print(vals.__next__())  # vvvvvvvvvvv


print(dict.copy(d))  # {'Michael': 95, 'v': 'vvvvvvvvvvv'}
print(dict.copy(d) == d)  # True


# 克隆, 深度
print(id(d.copy()) == id(d))  # False
dd = d.copy()
dd['v'] = 1111
# 清空
dd.clear()
print(dd)  # {}
print(d)  # 无变化

del dd  # 清除了, 之后无法访问了
