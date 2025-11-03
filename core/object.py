# type 类别 js 中的 function, 创建了所有类
# everything is object
# id(arg): 每个对象都有一个唯一id

print(object)  # <class 'object'>

print(id(object))  # 9442720


# ======= 基类 ========

print(int.__bases__)  # (<class 'object'>,)


class Electron:
    def __init__(self, value):
        self.value = value


print(Electron.__bases__)  # (<class 'object'>,)  # python3 中没有继承关系的基类指定为object


class ElectonApp(Electron):
    def __init__(self): pass


print(ElectonApp.__bases__)  # (<class '__main__.Electron'>,) ? 为何没有继承到object


# type 和 object
print(type(object))  # <class 'type'>  : object是type创建的
print(type(type))  # <class 'type'>
print(type.__bases__)  # (<class 'object'>,) : type继承了object
print(object.__bases__)  # () 无继承：固为基类


print('tuple:', tuple.__bases__)  # (<class 'object'>,)


# 普通 function
def getname(): pass


# 方法没有.__bases__属性
try:
    print(getname.__bases__)
except Exception as err:
    print(err)  # 'function' object has no attribute '__bases__'

# 对象三要素, 验证变量
oa = 4
print(id(oa))  # 9764480
print(type(oa))  # <class 'int'>
print(oa)  # 4

# 对象三要素, 验证函数
print(id(getname))  # 140032576339392
print(type(getname))  # <class 'function'>
print(getname)  # <function getname at 0x7f5bdff83dc0>

# 对象三要素, 验证类
print(id(Electron))  # 28142336
print(type(Electron))  # <class 'type'>
print(Electron)  # <class '__main__.Electron'>
