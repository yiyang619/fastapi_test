from fastapi import FastAPI, Request, Form
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from datetime import datetime
import matplotlib.pyplot as plt
import numpy as np
from io import BytesIO
import base64

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.post("/run-program")
async def execute_program(
        text_param: str = Form(...),
        date_param: str = Form(...),
        number_param: float = Form(...)
):
    try:
        date_obj = datetime.strptime(date_param, "%Y-%m-%d").date()
    except ValueError:
        return {"status": "error", "message": "Invalid date format"}

    # 处理参数
    processed_data = {
        "text": text_param.upper(),
        "date": date_obj.strftime("%Y年%m月%d日"),
        "number": number_param * 2,
        "calculated_value": round(number_param * 3.14, 2)
    }

    # 生成随机数据用于表格展示
    results = []
    for i in range(5):
        results.append({
            "id": i + 1,
            "name": f"Item {i + 1}",
            "value": round(number_param * (i + 1), 2),
            "date": date_obj.strftime(f"%Y-%m-{i + 1:02d}")
        })

    # 生成图片并转换为Base64
    img_base64 = generate_plot_base64(text_param, number_param)

    print(img_base64)
    return {
        "status": "success",
        "parameters": processed_data,
        "results": results,
        "image_data": img_base64  # 直接返回Base64编码的图片数据
    }


def generate_plot_base64(title, value):
    """生成图表并返回Base64编码"""
    plt.figure(figsize=(6, 4))
    x = [1, 2, 3, 4]
    y = [value, value * 2, value * 3, value * 4]
    plt.plot(x, y, 'b-o')
    plt.title(f"Data Visualization for {title}")
    plt.xlabel("X Axis")
    plt.ylabel("Y Axis")

    # 将图片保存到内存缓冲区
    buffer = BytesIO()
    plt.savefig(buffer, format='png')
    plt.close()

    # 转换为Base64编码
    img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
    # 检查生成的Base64数据
    print(f"Base64数据长度: {len(img_base64)}")  # 正常应该有几万字符
    print(f"Base64前缀: {img_base64[:100]}...")  # 应该以"data:image/png;base64,"开头
    # 在后端直接返回Base64编码的图片
    full_img_data = f"data:image/png;base64,{img_base64}"
    return {"image_data":full_img_data}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        # host="0.0.0.0",
        # port=8000,
        reload=True,
        log_level="info"
    )