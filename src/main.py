import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from src.DB.crud import AsyncORM
from src.routers import product, storage, supplier, relationships

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup code
    print("Application starting up...")
    await AsyncORM.create_tables()
    yield
    # Shutdown code
    print("Application shutting down...")

app = FastAPI(
    title="Система управления складскими остатками",
    description="API для управления товарами, складами и поставщиками",
    lifespan=lifespan
)

# Получаем абсолютный путь к директории проекта
base_dir = os.path.dirname(os.path.abspath(__file__))
static_dir = os.path.join(base_dir, "static")

# Создаем директорию если её нет
os.makedirs(static_dir, exist_ok=True)

# Монтируем статические файлы
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Подключаем роутеры
app.include_router(product.router)
app.include_router(supplier.router)
app.include_router(storage.router)
app.include_router(relationships.router)

@app.get("/", response_class=HTMLResponse)
async def read_root():
    try:
        html_path = os.path.join(static_dir, "index.html")
        with open(html_path, "r", encoding="utf-8") as f:
            html_content = f.read()
        return HTMLResponse(content=html_content, status_code=200)
    except FileNotFoundError:
        return HTMLResponse(content="<h1>Ошибка: index.html не найден</h1>", status_code=404)
