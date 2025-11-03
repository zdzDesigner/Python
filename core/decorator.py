

def createZip(hook):
    def process():
        print('exec')
        hook()

    return process


@createZip  # 装饰器
def successHook():
    print('success hook!')


# createZip(successHook)()
successHook()
