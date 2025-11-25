from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from src.DB.config import settings

async_engine = create_async_engine(
    url=settings.DATABASE_URL_asyncpg,
    # запросы НЕ будут выводится в консоль
    echo=False,
)

async_session_factory = async_sessionmaker(async_engine)

# Базовый класс для всех ORM моделей
class Base(DeclarativeBase):
    pass