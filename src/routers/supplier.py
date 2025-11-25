from fastapi import APIRouter, Body, HTTPException, status
from typing import Annotated

from src.schemas import  SupplierAddDTO, AddMsg, SupplierDTO
from src.DB.crud import AsyncORM

router = APIRouter(prefix="/supplier", tags=["Операции над поставщиками"])

@router.post("", summary="Добавить поставщика")
async def add_supplier(
        supplier: Annotated[SupplierAddDTO, Body()],
) -> AddMsg:
    try:
        supplier_id = await AsyncORM.insert_supplier(supplier)
        return {"ok": True, "id": supplier_id}
        
    except HTTPException:
        raise
    
@router.delete("", summary="Удалить поставщика")
async def delete_supplier(
        id: int,
):
    await AsyncORM.delete_supplier(id)

@router.get("", summary="Сводная таблица поставщиков")
async def all_suppliers():
    res = await AsyncORM.get_all_suppliers()
    return res

@router.put("", summary="Изменить информацию о поставщике")
async def put_supplier(
        supplier: Annotated[SupplierDTO, Body()],
):
    try:
        await AsyncORM.update_supplier(supplier)
        
    except HTTPException:
        raise
   

@router.get("/with_products", summary="Сводная таблица товаров и поставщиков")
async def products_by_supplier():
    res = await AsyncORM.get_products_with_suppliers()
    return res

@router.get("/supplied_products", summary="Товары от поставщика")
async def products_by_supplier(supplier_id: int):
    res = await AsyncORM.get_supplied_products(supplier_id)
    return res