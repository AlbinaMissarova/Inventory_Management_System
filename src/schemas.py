# прослойка между запросами и моделями БД
import re
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator

# DTO - Data Transfer Object - объект передачи данных
# добавление продукта - не должно содержаться ID - его присваивает БД
class ProductAddDTO(BaseModel):
    product_name: str
    product_description: Optional[str] = None

# продукт со всеми полями
class ProductDTO(ProductAddDTO):
    product_id: int

# добавление поставщика - не должно содержаться ID - его присваивает БД
class SupplierAddDTO(BaseModel):
    supplier_name: str
    email: Optional[EmailStr] = None
    phone: str
    
    # кастомный валидатор для номера телефона
    @field_validator("phone")
    @classmethod
    def validate_phone_number(cls, value: str) -> str:
        pattern = r'^\+7\(\d{3}\)\d{3}-\d{2}-\d{2}$'
        if not re.match(pattern, value):
            raise ValueError('Номер телефона должен быть в формате: +7(XXX)XXX-XX-XX')
        return value

# поставщик со всеми полями
class SupplierDTO(SupplierAddDTO):
    supplier_id: int

# добавление склада - не должно содержаться ID - его присваивает БД
class StorageAddDTO(BaseModel):
    storage_name: str
    address: Optional[str] = None 

# склад со всеми полями
class StorageDTO(StorageAddDTO):
    storage_id: int

# описание склада с товарами и остатками
class LeftoversDTO(BaseModel):
    product_id: int
    product_name: str
    storage_id: int
    storage_name: str
    # ge - больше или равно
    leftover: int = Field(ge=0, description="Остаток должен быть не меньше 0.")

# поставщики с товарами
class ProductsAndSuppliers(SupplierDTO):
    product_name: str
    product_id: int

# поставка - связь поставщиков и продуктов
class SupplyDTO(BaseModel):
    product_id: int
    supplier_id: int

# закупка - связь складов и продуктов
class PurchaseDTO(BaseModel):
    product_id: int
    storage_id: int
    leftover: int = Field(ge=0, description="Leftover must be greater than or equal to 0")

# подтверждение корректности добавления записи в БД
class AddMsg(BaseModel):
    ok: bool = True
    id: int