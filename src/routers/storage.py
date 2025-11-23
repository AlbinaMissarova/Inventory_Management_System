from fastapi import APIRouter, Body, HTTPException, Query
from typing import Annotated, Optional


from src.schemas import  StorageAddDTO, StorageDTO, AddMsg
from src.DB.crud import AsyncORM

router = APIRouter(prefix="/storage", tags=["Операции над складами"])

@router.post("", summary="Добавить склад")
async def add_storage(
        storage: Annotated[StorageAddDTO, Body()],
) -> AddMsg:
    storage_id = await AsyncORM.insert_storage(storage)
    return {"ok": True, "id": storage_id}

@router.delete("", summary="Удалить склад")
async def delete_storage(
        id: int,
):
    await AsyncORM.delete_storage(id)

@router.put("", summary="Изменить информацию о складе")
async def put_storage(
        storage: Annotated[StorageDTO, Body()],
):
    await AsyncORM.update_storage(storage)

@router.get("", summary="Все склады")
async def all_storages():
    res = await AsyncORM.get_all_storages()
    return res

@router.get("/leftovers", summary="Остатки товаров на складах")
async def deficit_products(
    num: Optional[int] = Query(
        default = None,
        ge=1, 
        description="Остаток товара. Оставьте путсым, чтобы посомореть все товары.",
    )
):
    # получить все товары
    if num is None:
        res = await AsyncORM.get_leftovers()
    else:
    # получить дефицит товаров
        if num <= 0:
            raise HTTPException(
            status_code=400,
            detail="Остаток товара должен быть положительным числом"
            )
        res = await AsyncORM.get_leftovers(num)
    return res