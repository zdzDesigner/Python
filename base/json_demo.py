import json


print(dir(json))

archive = {"name": "filenname", "prefix": "dirname"}
print(json.dumps(archive))
