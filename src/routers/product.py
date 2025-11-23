from fastapi import APIRouter, Body
from typing import Annotated

from src.schemas import ProductAddDTO, ProductDTO, AddMsg
from src.DB.crud import AsyncORM

router = APIRouter(prefix="/product", tags=["Операции с товарами"])

@router.post("", summary="Добавить товар")
async def add_product(
        product: Annotated[ProductAddDTO, Body()],
) -> AddMsg:
    product_id = await AsyncORM.insert_product(product)
    return {"ok": True, "id": product_id}

@router.put("", summary="Изменить информацию о товаре")
async def put_product(
        product: Annotated[ProductDTO, Body()],
):
    await AsyncORM.update_product(product)

@router.delete("", summary="Удалить товар")
async def delete_product(
        id: int,
):
    await AsyncORM.delete_product(id)

@router.get("", summary="Номенклатура")
async def all_products():
    res = await AsyncORM.get_all_products()
    return res



