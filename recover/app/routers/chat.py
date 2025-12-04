from fastapi import APIRouter, HTTPException, Depends
from app.routers.auth import get_current_user_payload
from app.supabase_client import supabase
from pydantic import BaseModel
from typing import List, Union, Optional
from postgrest.exceptions import APIError
import logging

router = APIRouter()

class MessageCreate(BaseModel):
    # sender_id / receiver_id may be numeric IDs or string UUIDs depending on auth backend
    sender_id: Union[int, str]
    receiver_id: Union[int, str]
    item_id: Optional[int] = None
    # when replying to a message, frontend may send `reply_to_id`
    reply_to_id: Optional[int] = None
    content: str

class MessageOut(BaseModel):
    id: int
    sender_id: Union[int, str]
    receiver_id: Union[int, str]
    item_id: Optional[int] = None
    reply_to_id: Optional[int] = None
    content: str
    sent_at: Optional[str] = None

# Enviar mensagem
@router.post('/', response_model=MessageOut)
def send_message(msg: MessageCreate):
    try:
        # avoid sending explicit nulls for optional fields
        payload = msg.dict(exclude_none=True)
        logging.info("Attempting to insert message payload: %s", payload)
        result = supabase.table("messages").insert(payload).execute()
    except APIError as e:
        detail = str(e)
        logging.error("APIError during insert: %s", repr(e))
        # also log args for more detail
        logging.debug("APIError args: %s", getattr(e, 'args', None))
        # Handle missing `reply_to_id` column in DB schema (Supabase/PostgREST PGRST204)
        if "Could not find the 'reply_to_id' column" in detail or 'PGRST204' in detail:
            logging.warning("reply_to_id column not found in DB schema; retrying insert without it")
            # retry without reply_to_id if it was provided
            payload = msg.dict(exclude_none=True)
            if 'reply_to_id' in payload:
                payload.pop('reply_to_id')
                logging.info("Retrying insert without 'reply_to_id'; payload: %s", payload)
                try:
                    result = supabase.table("messages").insert(payload).execute()
                except APIError as e2:
                    logging.error("Retry APIError: %s", repr(e2))
                    raise HTTPException(status_code=400, detail=(
                        "Erro ao salvar mensagem após remover 'reply_to_id'. "
                        "Parece que o PostgREST/Supabase ainda não reconhece a coluna no cache de schema. "
                        "Por favor, aplique a migração em `scripts/add_reply_to.sql` e reinicie/force o refresh do serviço PostgREST (ou aguarde alguns minutos). "
                        f"Detalhe original: {detail}; detalhe do retry: {str(e2)}"
                    ))
                # success on retry
            else:
                # reply_to_id wasn't in payload — propagate original error
                raise HTTPException(status_code=400, detail=(
                    "Erro ao salvar mensagem: coluna 'reply_to_id' não existe no banco. "
                    "Considere aplicar a migração em `scripts/add_reply_to.sql` e reiniciar o serviço PostgREST/Supabase para atualizar o cache de schema."
                ))
        # Detect common cause: attempting to insert a UUID/string into integer column
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
