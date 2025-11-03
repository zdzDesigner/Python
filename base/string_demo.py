a = 'abc'
print(dir(a))
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
b = a.replace('a', 'A')
print(b)  # Abc

# capitalize 首字母大写

print(a+a)  # abcabc
print(a*3)  # abcabcabc
print(a[2])  # c

print('b' in a)  # __iter__

for v in a:  # __iter__
    print(v)
# a
# b
# c

# 转义
print('\\n')  # \n
print(r'\n')  # \n
print(R'\n')  # \n

# format string %
print('string:%s, int:%d, float:%f' % ('zdz', 36, 7.8))
print('string:%s, int:%d, float:%s' % ('zdz', 36, 7.8))
print('string:{name}, int:{age}, float:{height}'.format(
    name='zdz', age=36, height=7.8))


# 多行
print('''
multi line string:
    1. =====\\n====
    2. xxxxxxx
''')

