def power(x, n):
    s = 1
    while n > 0:
        n = n - 1
        s = s * x
    return s


print(power(2, 2), power(2, 3))  # 4, 8


def add(a, b):
    return a + b


print(add(2, 5))  # 7

print(abs(-30))  # 30
print(max(2, 3, 1, -5))  # 3
print(int('123'))  # 123
print(int(12.34))  # 12
print(float('12.34'))  # 12.34
print(str(1.23))  # "1.23"
print(bool(1))  # True


def nop():
    pass


def profile():
    name = "Danny"
    age = 30
    return name, age


print(type(profile()))  # <class 'tuple'>
a, b = profile()
print(a, b)
