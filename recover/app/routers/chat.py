from fastapi import APIRouter, HTTPException, Depends
from app.routers.auth import get_current_user_payload
from app.supabase_client import supabase
from pydantic import BaseModel
from typing import List, Union
from postgrest.exceptions import APIError

router = APIRouter()

class MessageCreate(BaseModel):
    # sender_id / receiver_id may be numeric IDs or string UUIDs depending on auth backend
    sender_id: Union[int, str]
    receiver_id: Union[int, str]
    item_id: int
    content: str

class MessageOut(BaseModel):
    id: int
    sender_id: Union[int, str]
    receiver_id: Union[int, str]
    item_id: int
    content: str
    sent_at: str

# Enviar mensagem
@router.post('/', response_model=MessageOut)
def send_message(msg: MessageCreate):
    try:
        result = supabase.table("messages").insert(msg.dict()).execute()
    except APIError as e:
        # Detect common cause: attempting to insert a UUID/string into integer column
        detail = str(e)
        if 'invalid input syntax for type integer' in detail:
            raise HTTPException(status_code=400, detail=(
                "Erro ao salvar mensagem: seu remetente/recebedor parece ser um UUID/string, "
                "mas a coluna no banco espera um inteiro. \n" 
                "Soluções: (1) ajustar a tabela `messages` para usar TEXT para sender_id/receiver_id; "
                "(2) enviar IDs numéricos do frontend; ou (3) mapear UUIDs para IDs numéricos antes de inserir."
            ))
        raise HTTPException(status_code=400, detail=f"Erro ao salvar mensagem: {detail}")
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


# Mensagens envolvendo o usuário autenticado
@router.get('/me', response_model=List[MessageOut])
def my_messages(payload: dict = Depends(get_current_user_payload)):
    user_sub = payload.get('sub')
    # Postgrest expects string values quoted; detect numeric vs string
    q = f"'{user_sub}'" if isinstance(user_sub, str) and not str(user_sub).isdigit() else f"{user_sub}"
    result = supabase.table("messages").select("*")\
        .or_(f"sender_id.eq.{q},receiver_id.eq.{q}")\
        .execute()
    return result.data if result.data else []


# Caixa de entrada: mensagens recebidas pelo usuário autenticado
@router.get('/inbox', response_model=List[MessageOut])
def my_inbox(payload: dict = Depends(get_current_user_payload)):
    user_sub = payload.get('sub')
    q = f"'{user_sub}'" if isinstance(user_sub, str) and not str(user_sub).isdigit() else f"{user_sub}"
    result = supabase.table("messages").select("*").eq('receiver_id', user_sub).execute()
    return result.data if result.data else []
