# tuple 不可变
print(dir(tuple))
classmates = ('Michael', 'Bob', 'Tracy', 'Tracy')
print("classmates:", classmates)
print(len(classmates))

print(classmates[1])  # 'Bob'


onetup = (50,)  # 元组中只包含一个元素时，需要在元素后面添加逗号


class V:
    def __init__(self):
        self.key = "vvv"
    # 重写__repr__，返回目标格式的字符串

    def __repr__(self):
        return f"V( ({self.key}): \"vvv\")"


v = V()
print(v)
v.key


class User:
    def __init__(self, name, age):
        self.name = name
        self.age = age

    # 重写__repr__，返回易读的对象信息
    def __repr__(self):
        return f"User(name='{self.name}', age={self.age})"


user = User("Alice", 30)
print(user)  # 输出：User(name='Alice', age=30)
print(repr(user))  # 输出：User(name='Alice', age=30)
