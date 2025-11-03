import asyncio;


def count():
    yield 1
    yield 2
    yield 3

gen = count()
print(next(gen))  # 输出: 1
print(next(gen))  # 输出: 2
print(next(gen))  # 输出: 3
# print(next(gen))  # error



def consumer():
    value = yield "Start"
    print(f"Received: {value}")
    yield "End"
    yield "End2"

gen = consumer()
val1 = next(gen)        # 启动生成器
print(f"val1:{val1}") # Start
val2 = gen.send("Data") # 输出: Received: Data, 执行yield 返回End
print(f"val2:{val2}")
print(next(gen)) # End2



gen2 = consumer()
val2 = next(gen2)        # 启动生成器
print(val2) # Start
# 输出: Received: None
print(next(gen2)) # End
print(next(gen2)) # End2




async def async_gen():
    yield "Start"
    await asyncio.sleep(3)
    yield "End"

async def run():
    async for value in async_gen():
        print(value)

asyncio.run(run())
