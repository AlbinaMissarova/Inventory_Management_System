from typing import Optional
from sqlalchemy import and_, func, select, update
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from src.DB.database import Base, async_engine, async_session_factory
from src.DB.models import ProductOrm, ProductsAndStoragesORM, ProductsAndSuppliersORM, StorageOrm, SupplierOrm
from src.schemas import LeftoversDTO, ProductAddDTO, ProductDTO, ProductsAndSuppliers, PurchaseDTO, StorageAddDTO, StorageDTO, SupplierAddDTO, SupplierDTO, SupplyDTO


class AsyncORM:
    @staticmethod
    async def create_tables():
        async with async_engine.begin() as conn:
            # await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)

    # добавление - create
    # товара 
    @classmethod
    async def insert_product(cls, data: ProductAddDTO) -> int:
        async with async_session_factory() as session:
            product_dict = data.model_dump()

            product = ProductOrm(**product_dict)
            session.add(product)
            await session.commit()
            await session.refresh(product) 
            return product.product_id
        
    # поставщика
    @classmethod
    async def insert_supplier(cls, data: SupplierAddDTO) -> int:
        async with async_session_factory() as session:
            try:
                supplier_dict = data.model_dump()
                supplier = SupplierOrm(**supplier_dict)
                session.add(supplier)
                await session.commit()
                await session.refresh(supplier)
                return supplier.supplier_id
                
            except IntegrityError as e:
                await session.rollback()
                
                # Анализируем текст ошибки для определения конкретного нарушения
                error_msg = str(e.orig).lower()
                
                if "email" in error_msg and "unique" in error_msg:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Поставщик с такой почтой уже есть."
                    )
                elif "phone" in error_msg and "unique" in error_msg:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Поставщик с таким номером телефона уже есть."
                    )
            
            
    # склада
    @classmethod
    async def insert_storage(cls, data: StorageAddDTO) -> int:
        async with async_session_factory() as session:
            storage_dict = data.model_dump()

            storage = StorageOrm(**storage_dict)
            session.add(storage)
            # await session.flush()
            await session.commit()
            await session.refresh(storage) 
            return storage.storage_id  
        
    # добавление поставки - связь между продуктом и поставщиком
    @classmethod
    async def add_supplier_product_rel(cls, data: SupplyDTO):
        async with async_session_factory() as session:
            try:
                supply_dict = data.model_dump()
                supply = ProductsAndSuppliersORM(**supply_dict)
                session.add(supply)
                await session.commit()
                
            except IntegrityError as e:
                await session.rollback()
                error_msg = str(e.orig).lower()
                
                if "unique constraint" in error_msg or "duplicate key" in error_msg:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Такая поставка уже существует."
                    )

    # добавление закупки - связь между продуктом и складом
    @classmethod
    async def add_storage_product_rel(cls, data: PurchaseDTO):
        async with async_session_factory() as session:
            try:
                storage_dict = data.model_dump()
                purchase = ProductsAndStoragesORM(**storage_dict)
                session.add(purchase)
                await session.commit()
                
            except IntegrityError as e:
                await session.rollback()
                
                error_msg = str(e.orig).lower()
                
                if "unique constraint" in error_msg or "duplicate key" in error_msg:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Такая закупка уже существует."
                    )
                elif "leftover_non_negative" in error_msg or "check constraint" in error_msg:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Количество товара не может быть отрицательным."
                    )
            

    # select запросы - read 
    # "Номенклатура" (полный список всех товаров, имеющихся в системе).
    @classmethod
    async def get_all_products(cls) -> list[ProductDTO]:
        async with async_session_factory() as session:        
            query = (
                select(ProductOrm)
                .order_by(ProductOrm.product_id.asc())
            )
            res = await session.execute(query)
            result_orm = res.unique().scalars().all() 
            result_dto = [ProductDTO.model_validate(row, from_attributes=True) for row in result_orm]
            return result_dto

    # Реализовать таблицу "Поставщики".
    @classmethod
    async def get_all_suppliers(cls) -> list[SupplierDTO]:
        async with async_session_factory() as session:        
            query = (
                select(SupplierOrm)
                .order_by(SupplierOrm.supplier_id.asc())
            )
            res = await session.execute(query)
            result_orm = res.unique().scalars().all() 
            result_dto = [SupplierDTO.model_validate(row, from_attributes=True) for row in result_orm]
            return result_dto  
        
    # Реализовать таблицу "Склады".
    @classmethod
    async def get_all_storages(cls) -> list[StorageDTO]:
        async with async_session_factory() as session:        
            query = (
                select(StorageOrm)
                .order_by(StorageOrm.storage_id.asc())
            )
            res = await session.execute(query)
            result_orm = res.unique().scalars().all() 
            result_dto = [StorageDTO.model_validate(row, from_attributes=True) for row in result_orm]
            return result_dto  

    # Реализовать главную сводную таблицу "Остатки на складах". Таблица должна выводить данные в формате: "Артикул", "Название Товара", "Название Склада", "Текущий остаток" (в шт.)          
    # Реализовать фильтр "Товары в дефиците" (показать все позиции, остаток которых на любом из складов меньше N единиц).
    @classmethod
    async def get_leftovers(cls, num: Optional[int] = None) -> list[LeftoversDTO]:
        async with async_session_factory() as session: 
            if num == None:
                stmt = func.max(ProductsAndStoragesORM.leftover)
                res = await session.execute(stmt)
                num = res.scalar() + 1
            query = (
                select(
                    ProductOrm.product_id,
                    ProductOrm.product_name,
                    StorageOrm.storage_id.label("storage_id"),
                    StorageOrm.storage_name.label("storage_name"),
                    ProductsAndStoragesORM.leftover,
                )
                .join(
                    ProductsAndStoragesORM, 
                    ProductOrm.product_id == ProductsAndStoragesORM.product_id
                )
                .join(
                    StorageOrm, 
                    ProductsAndStoragesORM.storage_id == StorageOrm.storage_id
                )
                .filter(ProductsAndStoragesORM.leftover < num)
                .order_by(ProductOrm.product_id.asc())
            )

            res = await session.execute(query)
            result_rows = res.mappings().all()
            result_dto = [LeftoversDTO.model_validate(row) for row in result_rows]
            return result_dto 
    
    # Реализовать возможность отфильтровать номенклатуру по конкретному поставщику.
    @classmethod
    async def get_supplied_products(cls, supplier_id: int) -> list[ProductDTO]:
        async with async_session_factory() as session:     
            query = (
                select(SupplierOrm)
                .options(selectinload(SupplierOrm.supplied_products))
                .where(SupplierOrm.supplier_id==supplier_id)
            )
            res = await session.execute(query)
            result_orm = res.unique().scalars().one() 
            result_dto = [ProductDTO.model_validate(product, from_attributes=True) for product in result_orm.supplied_products]
            return result_dto
    
        
    # Реализовать сводную таблицу "Товары и поставщики": "Название Товара", "Название Поставщика", "Контакты Поставщика".
    @classmethod
    async def get_products_with_suppliers(cls) -> list[ProductsAndSuppliers]:
        async with async_session_factory() as session:        
            query = (
                select(
                    ProductOrm.product_id,
                    ProductOrm.product_name,
                    SupplierOrm.supplier_id,
                    SupplierOrm.supplier_name.label("supplier_name"),
                    SupplierOrm.email.label("email"),
                    SupplierOrm.phone.label("phone"),
                )
                .join(
                    ProductsAndSuppliersORM, 
                    ProductOrm.product_id == ProductsAndSuppliersORM.product_id
                )
                .join(
                    SupplierOrm, 
                    ProductsAndSuppliersORM.supplier_id == SupplierOrm.supplier_id
                )
                .order_by(ProductOrm.product_name.asc())
            )

            res = await session.execute(query)
            result_rows = res.mappings().all()
            result_dto = [ProductsAndSuppliers.model_validate(row) for row in result_rows]
            return result_dto 

    # изменение - update - 3
    # продукта
    @classmethod
    async def update_product(cls, data: ProductDTO):
        async with async_session_factory() as session:
            product_dict = data.model_dump()
            product_updated = ProductOrm(**product_dict)
            stmt = (
                update(ProductOrm)
                .where(ProductOrm.product_id == product_updated.product_id)
                .values(product_name=product_updated.product_name, product_description = product_updated.product_description)
            )
            await session.execute(stmt)
            await session.commit()

    # поставщика
    @classmethod
    async def update_supplier(cls, data: SupplierDTO):
        async with async_session_factory() as session:
            try:
                supplier_dict = data.model_dump()
                supplier_updated = SupplierOrm(**supplier_dict)
                stmt = (
                update(SupplierOrm)
                .where(SupplierOrm.supplier_id == supplier_updated.supplier_id)
                .values(supplier_name=supplier_updated.supplier_name, email = supplier_updated.email, phone = supplier_updated.phone)
                )
                await session.execute(stmt)
                await session.commit()
                
            except IntegrityError as e:
                await session.rollback()
                
                # Анализируем текст ошибки для определения конкретного нарушения
                error_msg = str(e.orig).lower()
                
                if "email" in error_msg and "unique" in error_msg:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Поставщик с такой почтой уже есть."
                    )
                elif "phone" in error_msg and "unique" in error_msg:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Поставщик с таким номером телефона уже есть."
                    )

    # склада
    @classmethod
    async def update_storage(cls, data: StorageDTO):
        async with async_session_factory() as session:
            storage_dict = data.model_dump()
            storage_updated = StorageOrm(**storage_dict)
            stmt = (
                update(StorageOrm)
                .where(StorageOrm.storage_id == storage_updated.storage_id)
                .values(storage_name=storage_updated.storage_name, address = storage_updated.address)
            )
            await session.execute(stmt)
            await session.commit()

    # закупки
    @classmethod
    async def update_purchase(cls, data: PurchaseDTO):
        async with async_session_factory() as session:
            purchase_dict = data.model_dump()
            purchase_updated = ProductsAndStoragesORM(**purchase_dict)
            stmt = (
                update(ProductsAndStoragesORM)
                .where(and_(ProductsAndStoragesORM.product_id == purchase_updated.product_id, ProductsAndStoragesORM.storage_id == purchase_updated.storage_id))
                .values(leftover=purchase_updated.leftover)
            )
            await session.execute(stmt)
            await session.commit()
            
    # удаление - delete
    # товара 
    @classmethod
    async def delete_product(cls, product_id: int):
        async with async_session_factory() as session:
            product = await session.get(ProductOrm, product_id)
            if product:
                await session.delete(product)
                await session.commit()  
    
    # поставщика
    @classmethod
    async def delete_supplier(cls, supplier_id: int):
        async with async_session_factory() as session:
            supplier = await session.get(SupplierOrm, supplier_id)
            if supplier:
                await session.delete(supplier) 
                await session.commit()  
    # склада 
    @classmethod
    async def delete_storage(cls, storage_id: int):
        async with async_session_factory() as session:
            storage = await session.get(StorageOrm, storage_id)
            if storage:
                await session.delete(storage)
                await session.commit() 

    # поставки 
    @classmethod
    async def delete_supply(cls, product_id: int, supplier_id: int):
        async with async_session_factory() as session:
            supply = await session.get(ProductsAndSuppliersORM, (product_id, supplier_id))
            if supply:
                await session.delete(supply)
                await session.commit() 

    # закупки 
    @classmethod
    async def delete_purchase(cls, product_id: int, storage_id: int):
        async with async_session_factory() as session:
            purchase = await session.get(ProductsAndStoragesORM, (product_id, storage_id))
            if purchase:
                await session.delete(purchase)
                await session.commit() 