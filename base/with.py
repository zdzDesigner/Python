# 传统方式（需要手动关闭）
f = open('file.txt', 'r')
try:
    data = f.read()
finally:
    f.close()


# 自定关闭
with open('file.txt', "wb") as dfile:
    print(dfile.readall())
