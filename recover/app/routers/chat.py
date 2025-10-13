from fastapi import APIRouter, HTTPException
from app.supabase_client import supabase
from pydantic import BaseModel
from typing import List

router = APIRouter()

class MessageCreate(BaseModel):
    sender_id: int
    receiver_id: int
    item_id: int
    content: str

class MessageOut(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    item_id: int
    content: str
    sent_at: str

# Enviar mensagem
@router.post('/', response_model=MessageOut)
def send_message(msg: MessageCreate):
    result = supabase.table("messages").insert(msg.dict()).execute()
    if result.data:
        return result.data[0]
    raise HTTPException(status_code=400, detail="Erro ao enviar mensagem")

# Listar mensagens entre dois usuários
@router.get('/{user1_id}/{user2_id}', response_model=List[MessageOut])
def list_messages(user1_id: int, user2_id: int):
    result = supabase.table("messages").select("*")\
        .or_(f"sender_id.eq.{user1_id},receiver_id.eq.{user2_id}")\
        .or_(f"sender_id.eq.{user2_id},receiver_id.eq.{user1_id}")\
        .execute()
    return result.data if result.data else []
