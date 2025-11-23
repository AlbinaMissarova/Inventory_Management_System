# Данный файл содержит описание всех сущностей базы данных

from typing import Annotated, Optional
from sqlalchemy import CheckConstraint, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.DB.database import Base

# intpk - integer primary key
intpk = Annotated[int, mapped_column(primary_key=True)]

# товары
class  ProductOrm(Base):
    __tablename__ = "products"

    #  артикул
    product_id: Mapped[intpk]
    product_name: Mapped[str]
    product_description: Mapped[str] = mapped_column(String, unique=True, nullable=True)  

    # связь многие ко многим
    # с поставщиками 
    product_suppliers: Mapped[list["SupplierOrm"]] = relationship(
        back_populates="supplied_products",
        secondary="products_and_suppliers",
    )
    # со складами 
    product_in_storages: Mapped[list["StorageOrm"]] = relationship(
        back_populates="available_products",
        secondary="products_and_storages",
    )

# поставщики
class SupplierOrm(Base):
    __tablename__ = "suppliers"

    supplier_id: Mapped[intpk]
    supplier_name: Mapped[str]
    email: Mapped[str] = mapped_column(String, unique=True, nullable=True)  
    phone: Mapped[str] = mapped_column(String, unique=True, nullable=False)  

    # связь многие ко многим
    # с товарами 
    supplied_products: Mapped[list["ProductOrm"]] = relationship(
        back_populates="product_suppliers",
        secondary="products_and_suppliers",
    )

# связь поставщиков и товаров
class ProductsAndSuppliersORM(Base):
    __tablename__ = "products_and_suppliers"
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.product_id", ondelete="CASCADE"),
        primary_key=True,
    )
    supplier_id:Mapped[int] = mapped_column(
        ForeignKey("suppliers.supplier_id", ondelete="CASCADE"),
        primary_key=True,
    )

#  склады 
class StorageOrm(Base):
    __tablename__ = "storages"

    storage_id: Mapped[intpk]
    storage_name: Mapped[str]
    address: Mapped[str] = mapped_column(String, unique=True, nullable=True) 

    # связь многие ко многим
    # с товарами 
    available_products: Mapped[list["ProductOrm"]] = relationship(
        back_populates="product_in_storages",
        secondary="products_and_storages",
    )

# связь складов и товаров  
class ProductsAndStoragesORM(Base):
    __tablename__ = "products_and_storages"
    product_id:Mapped[int] = mapped_column(
        ForeignKey("products.product_id", ondelete="CASCADE"),
        primary_key=True,
    )
    storage_id:  Mapped[int] = mapped_column(
        ForeignKey("storages.storage_id", ondelete="CASCADE"),
        primary_key=True,
    )
    leftover: Mapped[int]

    __table_args__ = (
        CheckConstraint('leftover >= 0', name='leftover_non_negative'),
    )

