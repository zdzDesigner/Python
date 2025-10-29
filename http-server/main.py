from fastapi import FastAPI, Request, UploadFile, File
import shutil
import os

app = FastAPI()

# 确保 assets 目录存在
os.makedirs("assets", exist_ok=True)


# 中间件（类似 Koa）
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request.state.request_id = "req-456"  # 类似 Koa 的 ctx.state
    response = await call_next(request)
    response.headers["X-Request-ID"] = request.state.request_id
    return response


# 路由
@app.get("/")
async def hello_world(request: Request):
    return {"message": f"Hello {request.state.request_id}"}


@app.post("/uploadfile/")
async def create_upload_file(file: UploadFile = File(...)):
    file_path = f"assets/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"filename": file.filename}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8100)
    # uvicorn.run(app, host="0.0.0.0", port=8100, reload=True)  # reload=True 开发时自动重载
