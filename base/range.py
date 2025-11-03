print(len(range(3)))  # 3
print(len(range(3, 5)))  # 2
print(len(range(3, 3)))  # 0
print(range(3, 6, 2), len(range(3, 6, 2)))  # 2: >=3 && <6 步长为2
print(list(range(3, 6, 2)))  # [3, 5]


try:
    print(range(3, 3)[0])  # 超出范围
except Exception as err:
    print(err)  # range object index out of range

print(range(3, 4)[0])  # 3

print(int((41 - (41 % 2))/2))
print(41//2)
print(type(41//2))  # <class 'int'>


for n in range(2, 10):
    for x in range(2, n):
        print(n)
        break
        # if n % x == 0:
        #     print(n, 'equals', x, '*', n//x)
        #     break
    else:  # for 循环也有一个大多数人都不熟悉 else 子句，该 else 子句在循环正常完成时执行，这意味着循环没有遇到任何 break 语句。
        print(n, 'is a prime number')
