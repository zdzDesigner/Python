import re

# 定义符号表的数据结构
symbol_table = {}

# 解析源代码并提取标识符


def parse_source_code(source_code):
    # 使用正则表达式匹配标识符
    pattern = r'\b[a-zA-Z_][a-zA-Z0-9_]*\b'
    identifiers = re.findall(pattern, source_code)
    return identifiers

# 记录标识符的属性和类型信息


def record_identifier(identifier):
    # 如果标识符已经存在于符号表中，则报错
    if identifier in symbol_table:
        raise ValueError(f"Duplicate definition of identifier '{identifier}'")
    # 否则将标识符添加到符号表中
    symbol_table[identifier] = {
        'type': None,
        'scope': None,
        'is_global': False,
        'is_local': False
    }

# 检查语义错误


def check_semantic_errors():
    # 检查是否存在未声明就使用的标识符
    for identifier, attributes in symbol_table.items():
        if not attributes['type']:
            raise ValueError(
                f"Identifier '{identifier}' is used before declaration")

# 输出符号表


def print_symbol_table():
    print("Symbol Table:")
    for identifier, attributes in symbol_table.items():
        print(f"{identifier}: {attributes}")


# 测试代码
source_code = """
int main() {
    int a;
    float b;
    double c;
    a = 10;
    b = 20.5;
    c = 30.0;
    return 0;
}
"""
identifiers = parse_source_code(source_code)
print(identifiers)

for identifier in identifiers:
    record_identifier(identifier)
#
# check_semantic_errors()
# print_symbol_table()
