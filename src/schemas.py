# прослойка между запросами и моделями БД
import re
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator

class ProductAddDTO(BaseModel):
    product_name: str
    product_description: Optional[str] = None

class ProductDTO(ProductAddDTO):
    product_id: int

    # model_config = ConfigDict(from_attributes=True)

class AddMsg(BaseModel):
    ok: bool = True
    id: int

class SupplierAddDTO(BaseModel):
    supplier_name: str
    email: Optional[EmailStr] = None
    phone: str
    
    @field_validator("phone")
    @classmethod
    def validate_phone_number(cls, value: str) -> str:
        pattern = r'^\+7\(\d{3}\)\d{3}-\d{2}-\d{2}$'
        if not re.match(pattern, value):
            raise ValueError('Номер телефона должен быть в формате: +7(XXX)XXX-XX-XX')
        return value

class SupplierDTO(SupplierAddDTO):
    supplier_id: int

class StorageAddDTO(BaseModel):
    storage_name: str
    address: Optional[str] = None 

class StorageDTO(StorageAddDTO):
    storage_id: int


class LeftoversDTO(BaseModel):
    product_id: int
    product_name: str
    storage_id: int
    storage_name: str
    leftover: int = Field(ge=0, description="Остаток должен быть не меньше 0.")

class ProductsAndSuppliers(SupplierAddDTO):
    product_name: str

# поставка - связь поставщиков и продуктов
class SupplyDTO(BaseModel):
    product_id: int
    supplier_id: int

# закупка - связь складов и продуктов
class PurchaseDTO(BaseModel):
    product_id: int
    storage_id: int
    leftover: int = Field(ge=0, description="Leftover must be greater than or equal to 0")
