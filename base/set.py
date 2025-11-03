s1 = set([1, 2, 3])
s2 = set([2, 3, 4])
print(s1 & s2)  # {2, 3}
print(s1 | s2)  # {1, 2, 3, 4}
print(s1.union(s2))  # {1, 2, 3, 4}


print(type(set([2, 4])))  # <class 'set'>
print(type({2, 4}))  # <class 'set'>
print(type((2, 4)))  # <class 'tuple'>


dup_list = ['a', 'b', 'c', 'z', 'b', 'd', 'm', 'n', 'n', 'b', 'z']

print(dup_list)  # ['a', 'b', 'c', 'z', 'b', 'd', 'm', 'n', 'n', 'b', 'z']
dup = set([x for x in dup_list if dup_list.count(x) > 1])
print(dup)

print(x for x in dup_list if dup_list.count(x) > 1)
# <generator object <genexpr> at 0x7f53d7ce0820>


print(set(dup_list))  # {'b', 'd', 'z', 'c', 'a', 'n', 'm'}
print(set('ababab'))  # {'a', 'b'}


s2 = set([1, 2, 3, 4, 5])
print("原始数据：", s2)
s2.add("j")
print("添加数据后：", s2)
s2.remove(3)
print("删除数据后：", s2)
s2.update([6, 7, 8, 9])  # ? 添加多个
print("update数据后：", s2)
# 原始数据： {1, 2, 3, 4, 5}
# 添加数据后： {1, 2, 3, 4, 5, 'j'}
# 删除数据后： {1, 2, 4, 5, 'j'}
# update数据后： {1, 2, 4, 5, 6, 7, 8, 9, 'j'}


print(set([1, 2, 3, 4, 5]).union(set([11])))  # {1, 2, 3, 4, 5, 11}
print(set([1, 2, 3, 4, 5]).difference(set([11, 3, 1])))  # {2, 4, 5}


s3 = frozenset("frozenset")
print(s3)  # frozenset({'e', 'r', 's', 'z', 'n', 'f', 'o', 't'})
print(type(s3))  # <class 'frozenset'>
