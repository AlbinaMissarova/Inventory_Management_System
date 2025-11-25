# Данный файл содержит эндпоинты, относящиеся к работе со связями между сущностями БД 
from fastapi import APIRouter, Body, HTTPException
from typing import Annotated

from src.schemas import PurchaseDTO, SupplyDTO
from src.DB.crud import AsyncORM

router = APIRouter(prefix="", tags=["Операции над связями между товарами, поставщиками и складами"])


@router.post("/supply", summary="Добавить поставку")
async def add_product_supplier_relationship(
    new_supply : Annotated[SupplyDTO, Body()]
):
    try:
        await AsyncORM.add_supplier_product_rel(new_supply)
        return {"ok": True}
    except HTTPException:
        raise

@router.delete("/supply", summary="Удалить поставку")
async def delete_storage(
        product_id: int,
        supplier_id: int,
):
    await AsyncORM.delete_supply(product_id, supplier_id)

@router.post("/purchase", summary="Добавить закупку")
async def add_product_storage_relationship(
    new_purchase: Annotated[PurchaseDTO, Body()]
):
    try:
        await AsyncORM.add_storage_product_rel(new_purchase)
        return {"ok": True}
    except HTTPException:
        raise

@router.delete("/purchase", summary="Удалить закупку")
async def delete_purchase(
        product_id: int,
        storage_id: int,
):
    await AsyncORM.delete_purchase(product_id, storage_id)

@router.put("/purchase", summary="Изменить закупку")
async def put_purchase(
        purchase: Annotated[PurchaseDTO, Body()],
):
    await AsyncORM.update_purchase(purchase)