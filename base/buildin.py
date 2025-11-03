import inspect


# dir ================
# 重载运算符
# `__add__`:+, `__sub__`:- `__mul__`:* `__truediv__`:/
# `__gt__`:>, `__lt__`:<, `__ge__`:>=, `__le__`:<=
# ['__add__', '__class__', '__contains__', '__delattr__',
#  '__dir__', '__doc__', '__eq__', '__format__', '__ge__', '__getattribute__',
#  '__getitem__', '__gt__', '__hash__', '__iadd__', '__imul__', '__init__',
#  '__init_subclass__', '__iter__', '__le__', '__len__', '__lt__', '__mul__',
#  '__ne__', '__new__', '__reduce__', '__reduce_ex__', '__repr__',
#  '__reversed__', '__rmul__', '__setattr__', '__setitem__', '__sizeof__',
#  '__str__', '__subclasshook__',

# 当前作用域变量名
print(dir())
#  ['__annotations__', '__builtins__', '__cached__', '__doc__', '__file__',
#   '__loader__', '__name__', '__package__', '__spec__', 'list']

print(dir(int))
# ['__abs__', '__add__', '__and__', '__bool__', '__ceil__', '__class__',
#  '__delattr__', '__dir__', '__divmod__', '__doc__', '__eq__', '__float__',
#  '__floor__', '__floordiv__', '__format__', '__ge__', '__getattribute__',
#  '__getnewargs__', '__gt__', '__hash__', '__index__', '__init__',
#  '__init_subclass__', '__int__', '__invert__', '__le__', '__lshift__',
#  '__lt__', '__mod__', '__mul__', '__ne__', '__neg__', '__new__', '__or__',
#  '__pos__', '__pow__', '__radd__', '__rand__', '__rdivmod__', '__reduce__',
#  '__reduce_ex__', '__repr__', '__rfloordiv__', '__rlshift__', '__rmod__',
#  '__rmul__', '__ror__', '__round__', '__rpow__', '__rrshift__', '__rshift__',
#  '__rsub__', '__rtruediv__', '__rxor__', '__setattr__', '__sizeof__',
#  '__str__', '__sub__', '__subclasshook__', '__truediv__', '__trunc__',
#  '__xor__',
#  'as_integer_ratio', 'bit_length', 'conjugate', 'denominator', 'from_bytes',
#  'imag', 'numerator', 'real', 'to_bytes']


# list对象属性
list = [1, 3, 4, 5, 4, 3, 8]


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
print(list.count(4))  # 2 出现数量
print(list.index(3))


# set 对象属性
print(dir(set))
# ['__and__', '__class__', '__contains__', '__delattr__', '__dir__',
#  '__doc__', '__eq__', '__format__', '__ge__', '__getattribute__',
#  '__gt__', '__hash__', '__iand__', '__init__', '__init_subclass__',
#  '__ior__', '__isub__', '__iter__', '__ixor__', '__le__', '__len__',
#  '__lt__', '__ne__', '__new__', '__or__', '__rand__', '__reduce__',
#  '__reduce_ex__', '__repr__', '__ror__', '__rsub__', '__rxor__',
#  '__setattr__', '__sizeof__', '__str__', '__sub__', '__subclasshook__',
#  '__xor__',
#  'add', 'clear', 'copy', 'difference', 'difference_update','discard',
#  'intersection', 'intersection_update', 'isdisjoint', 'issubset',
#  'issuperset', 'pop', 'remove', 'symmetric_difference',
#  'symmetric_difference_update', 'union', 'update']

# string对象属性
print(dir(''))
# ['__add__', '__class__', '__contains__', '__delattr__', '__dir__',
#  '__doc__', '__eq__', '__format__', '__ge__', '__getattribute__',
#  '__getitem__', '__getnewargs__', '__gt__', '__hash__', '__init__',
#  '__init_subclass__', '__iter__', '__le__', '__len__', '__lt__',
#  '__mod__', '__mul__', '__ne__', '__new__', '__reduce__',
#  '__reduce_ex__', '__repr__', '__rmod__', '__rmul__',
#  '__setattr__', '__sizeof__', '__str__', '__subclasshook__',
#  'capitalize', 'casefold', 'center', 'count', 'encode',
#  'endswith', 'expandtabs', 'find', 'format', 'format_map',
#  'index', 'isalnum', 'isalpha', 'isascii', 'isdecimal',
#  'isdigit', 'isidentifier', 'islower', 'isnumeric',
#  'isprintable', 'isspace', 'istitle', 'isupper', 'join',
#  'ljust', 'lower', 'lstrip', 'maketrans', 'partition',
#  'replace', 'rfind', 'rindex', 'rjust', 'rpartition',
#  'rsplit', 'rstrip', 'split', 'splitlines', 'startswith',
#  'strip', 'swapcase', 'title', 'translate', 'upper', 'zfill']


# type ==================
print(type(3))  # <class 'int'>
print(type(''))  # <class 'str'>
print(type([]))  # <class 'list'>
print(type({}))  # <class 'dict'>
print(type(dict))  # <class 'type'>


# id =============
name = "zdz"
print(id(name))  # 唯一 ID 140692544375856


# ======================
print(inspect.getmembers(str))
print(inspect.getmembers(list))


print("enumerate::", enumerate)  # <class 'enumerate'>


class B:
    def __init__(self, value):
        self.value = value

    def __nonzero__():
        return False


print(bool(B(0)))
