def argtransfer(arg):
    print(arg)  # zdz
    arg = 'xx'
    print(arg)  # xx


name = 'zdz'
argtransfer(name)
print(name)  # zdz


# ======== 未更改全局 ===
LANG = 'zh'


def implicitGlobal():
    LANG = 'en'
    print(LANG)  # en


implicitGlobal()
print(LANG)  # zh


# ======== global关键子 更改全局 ===
LANG_CUR = 'zh'


def explictGlobal():
    global LANG_CUR

    LANG_CUR = 'en'
    print(LANG_CUR)  # en


explictGlobal()
print(LANG_CUR)  # en


# 指针拷贝
mylist = [3, 2, 1]


def append(mylist):
    mylist.append('s')


append(mylist)
print(mylist)  # [3, 2, 1, 's']


# 命名参数
def func3(a, b=5, c=10):
    print('a is', a, 'and b is', b, 'and c is', c)


print('关键字传参。。。。。')
func3(3, 7)
func3(25, c=24)
func3(c=50, a=100)
