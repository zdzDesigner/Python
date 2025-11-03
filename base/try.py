

try:
    print(type())
except Exception as err:
    print(err)  # type() takes 1 or 3 arguments
finally:
    print('finally!')


def throwerr():
    try:
        print(type())
    except Exception as err:
        raise err  # throw err


try:
    throwerr()
except Exception as err:
    print(err)


# else代码中的异常不会被 `try` 捕获
try:
    print('everything ok!')
    print(type())  # 被捕获
except Exception as err:
    print(err)
else:
    print()
    # print(type())  # 不会被捕获
finally:
    print('finally!')


def getType():
    try:
        tstr = type('')
        # print(tstr)
        return tstr
    except Exception as err:
        raise err  # throw err


print(getType())
