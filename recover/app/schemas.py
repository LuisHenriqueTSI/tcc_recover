
from pydantic import BaseModel, EmailStr
from typing import Optional, List

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    is_active: bool
    created_at: Optional[str]
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = 'bearer'

class PublicationCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class PublicationOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    category: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    owner_id: str
    created_at: Optional[str]
    class Config:
        from_attributes = True

# Fotos dos itens
class PhotoOut(BaseModel):
    id: int
    item_id: int
    url: str
    uploaded_at: Optional[str]
    class Config:
        from_attributes = True

# Mensagens (chat)
class MessageOut(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    item_id: int
    content: str
    sent_at: Optional[str]
    class Config:
        from_attributes = True

# Categorias
class CategoryOut(BaseModel):
    id: int
    name: str
    class Config:
        from_attributes = True

# Denúncias
class ReportOut(BaseModel):
    id: int
    reporter_id: int
    item_id: int
    reason: str
    created_at: Optional[str]
    class Config:
        from_attributes = True
