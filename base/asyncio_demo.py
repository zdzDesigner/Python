from contextlib import asynccontextmanager
import asyncio

@asynccontextmanager
async def async_timer(name):
    start = asyncio.get_event_loop().time()
    try:
        yield  # 在此处执行异步代码块 <<<<
    finally:
        duration = asyncio.get_event_loop().time() - start
        print(f"{name} took {duration:.2f} seconds")

# 使用示例
async def main():
    async with async_timer("Database query"):
        await asyncio.sleep(1.5)  # 模拟异步操作 >>>>


asyncio.run(main())
asyncio.run(main())
# 输出: Database query took 1.50 seconds
