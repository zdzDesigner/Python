from collections.abc import Sized
from abc import ABC, abstractmethod


class Tray:
    def __init__(self, menus):
        self.menus = menus

    # 魔术方法
    # 迭代
    # 内置方法(python 解释器实现)
    def __getitem__(self, item):
        return self.menus[item]

    def __len__(self):
        return len(self.menus)

    def __str__(self):
        return '自定义描述'


# 方式一: 传统方式
tray = Tray(['详情', '退出'])

for menu in tray.menus:
    print(menu)


# 方式二:  __getitem__ 迭代
for menu in tray:
    print(menu)


print(tray[1])  # '退出': 迭代器
print(len(tray))  # 2
print(hasattr(tray, '__len__'))  # True: 是否包含属性

print(tray)  # 默认: <__main__.Tray object at 0x7fa751bd3f70>; __str__: 自定义描述
print(repr(tray))  # <__main__.Tray object at 0x7fa751bd3f70>


# 无参类
class Thing:
    def instance(self):
        return self


thing2 = Thing()
print(id(thing2.instance) != id(Thing.instance))  # True  静态方法, 实例方法

# try:
# except Exception as err:
#     print(err)  # 'function' object has no attribute 'instance'

# ========== 鸭子
menus = ['版本']
update_tuple = ('升级',)
menus.extend(update_tuple)  # ['版本', '升级']
print(menus)

menus.extend(tray)  # extend 参数为实现迭代器的对象(如:元组、Tray(__getitem__))
print(menus)  # ['版本', '升级', '详情', '退出']

# 抽象基类
print(isinstance(tray, Sized))  # True: 实例,抽象类, 接口?
print(isinstance(tray, Tray))  # True


# 强制实现父类
class Parent(ABC):
    @abstractmethod
    def getname(self): pass


class Sub(Parent):
    def getname(self): pass


sub = Sub()



