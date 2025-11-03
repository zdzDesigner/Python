arr = ['Michael', 'Bob', 'Tracy', 'Bob', 'Bob']
print(type(arr))  # <class 'list'>
print(dir(list))
# ['__add__', '__class__', '__contains__', '__delattr__', '__delitem__',
#  '__dir__', '__doc__', '__eq__', '__format__', '__ge__', '__getattribute__',
#  '__getitem__', '__gt__', '__hash__', '__iadd__', '__imul__', '__init__',
#  '__init_subclass__', '__iter__', '__le__', '__len__', '__lt__', '__mul__',
#  '__ne__', '__new__', '__reduce__', '__reduce_ex__', '__repr__',
#  '__reversed__', '__rmul__', '__setattr__', '__setitem__', '__sizeof__',
#  '__str__', '__subclasshook__',
#  'append', 'clear', 'copy', 'count', 'extend','index',
#  'insert', 'pop', 'remove','reverse', 'sort']

print('Bob' in arr)  # True
print('Bob' not in arr)  # False

print(len(arr))  # 5
print(arr[0])  # Michael
print(arr.count('Bob'))  # 3, 返回包含元素的个数

# 切片
sub1 = arr[0:]
sub2 = arr[0:]
print(sub1)  # ['Michael', 'Bob', 'Tracy', 'Bob', 'Bob']
print(id(arr) == id(sub2))  # False
print(id(sub1) == id(sub2))  # False
print(id(arr[0:]) == id(arr[0:]))  # True ? 优化
print(arr[1:2])  # ['Bob'] 左闭右开 和go、zig一致


# 删除
del sub1[1]
print(sub1)  # ['Michael', 'Tracy', 'Bob', 'Bob']

# ===== 操作符 =====
# +: __add__
# *: __mul__

arr.insert(0, "aa")
print(arr)  # ['aa', 'Michael', 'Bob', 'Tracy', 'Bob', 'Bob']
arr.pop()
print(arr)  # ['aa', 'Michael', 'Bob', 'Tracy', 'Bob']
arr.pop(0)
print(arr)  # ['Michael', 'Bob', 'Tracy', 'Bob']

# 排序
a = ['c', 'a', 'b']
print(a)  # ['c', 'a', 'b']
a.sort()
print(a)  # ['a', 'b', 'c']
# a.sort()  # ?自定义排序
a.reverse()
print(a)  # ['c', 'b', 'a']


__hidden = "hidden"
