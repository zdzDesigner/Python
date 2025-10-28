from fastapi.testclient import TestClient
from main import app
import os

client = TestClient(app)

def test_upload_file():
    # 创建一个测试文件
    test_file_path = "test_upload.txt"
    with open(test_file_path, "w") as f:
        f.write("This is a test file.")

    # 上传文件
    with open(test_file_path, "rb") as f:
        response = client.post("/uploadfile/", files={"file": ("test_upload.txt", f, "text/plain")})

    # 清理测试文件
    os.remove(test_file_path)

    # 断言
    assert response.status_code == 200
    assert response.json() == {"filename": "test_upload.txt"}

    # 检查文件是否已保存
    uploaded_file_path = "assets/test_upload.txt"
    assert os.path.exists(uploaded_file_path)

    # 清理上传的文件
    os.remove(uploaded_file_path)
