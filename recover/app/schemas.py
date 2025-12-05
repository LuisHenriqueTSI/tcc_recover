
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
    status: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location: Optional[str] = None
    date: Optional[str] = None

class PublicationUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location: Optional[str] = None
    date: Optional[str] = None
    resolved: Optional[bool] = None

class PublicationOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    category: Optional[str]
    status: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    location: Optional[str]
    date: Optional[str]
    owner_id: str
    created_at: Optional[str]
    resolved: Optional[bool] = False
    resolved_at: Optional[str] = None
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


class PhotoCreate(BaseModel):
    item_id: int
    url: str

# Mensagens (chat)
class MessageOut(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    item_id: Optional[int]
    reply_to_id: Optional[int]
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

# Estatísticas
class CategoryStats(BaseModel):
    category: str
    count: int

class Statistics(BaseModel):
    total_resolved: int
    by_category: List[CategoryStats]
