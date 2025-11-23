# import asyncio
# from typing import Annotated
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from src.DB.config import settings


async_engine = create_async_engine(
    url=settings.DATABASE_URL_asyncpg,
    # запросы будут выводится в консоль
    echo=True,
    # pool_size=5,
    # max_overflow=10,
)

async_session_factory = async_sessionmaker(async_engine)

# str_256 = Annotated[str, 256]

class Base(DeclarativeBase):
    # type_annotation_map = {
    #     str_256: String(256)
    # }

    # def __repr__(self):
    #     cols = []
    #     for col in self.__table__.columns.keys():
    #         cols.append(f"{col}={getattr(self, col)}")
    #     return f"<{self.__class__.__name__} {','.join(cols)}>"
    pass