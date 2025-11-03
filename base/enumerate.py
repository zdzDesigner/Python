names = ['aaa', 'bbb', 'ccc']

print(enumerate(names))  # <enumerate object at 0x7f8a9be7ff80>

for k, v in enumerate(names):
    print(k, v)

# 0 aaa
# 1 bbb
# 2 ccc


# 基数增长
for k, v in enumerate(names, 10):
    print(k, v)

# 10 aaa
# 11 bbb
# 12 ccc


# 创建元组列表 ============
tuple_list = list(enumerate(names, 20))
# [(20, 'aaa'), (21, 'bbb'), (22, 'ccc')]

print(tuple_list)
