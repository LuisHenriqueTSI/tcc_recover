from fastapi import APIRouter, HTTPException, Depends
from app.routers.auth import get_current_user_payload
from app.supabase_client import supabase
from app.crud_supabase import get_item
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
    sender_name: Optional[str] = None
    receiver_id: Union[int, str]
    item_id: Optional[int] = None
    item_title: Optional[str] = None
    reply_to_id: Optional[int] = None
    content: str
    sent_at: Optional[str] = None
    read: Optional[bool] = False
    read_at: Optional[str] = None


def _get_user_name(uid: Union[int, str]) -> Optional[str]:
    try:
        if uid is None:
            return None
        q = str(uid)
        # try profiles table first
        r = supabase.table('profiles').select('name,email').eq('id', q).execute()
        if r and getattr(r, 'data', None) and len(r.data) > 0:
            row = r.data[0]
            if row.get('name'):
                return row.get('name')
            if row.get('email'):
                return row.get('email').split('@')[0]
        # fallback: try auth.users email
        ru = supabase.table('users').select('email').eq('id', q).execute()
        if ru and getattr(ru, 'data', None) and len(ru.data) > 0:
            e = ru.data[0].get('email')
            if e:
                return e.split('@')[0]
    except Exception:
        pass
    return None

# Enviar mensagem
@router.post('/', response_model=MessageOut)
def send_message(msg: MessageCreate):
    try:
        # avoid sending explicit nulls for optional fields
        payload = msg.dict(exclude_none=True)
        # If this is a reply and no item_id was provided, try to inherit item_id from the replied message
        try:
            if payload.get('item_id') is None and payload.get('reply_to_id'):
                rid = payload.get('reply_to_id')
                orig = supabase.table('messages').select('*').eq('id', rid).execute()
                if orig and getattr(orig, 'data', None):
                    o = orig.data[0]
                    if o and o.get('item_id'):
                        payload['item_id'] = o.get('item_id')
        except Exception:
            # don't block sending if lookup fails
            logging.debug('Failed to inherit item_id from replied message', exc_info=True)

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
        out = result.data[0]
        # attach item title if possible to help frontend display
        try:
            iid = out.get('item_id')
            if iid:
                it = get_item(iid)
                if it:
                    out['item_title'] = it.get('title') or it.get('name')
        except Exception:
            # don't fail the request if item lookup fails; log is already handled elsewhere
            pass
        # attach sender name when possible
        try:
            sname = _get_user_name(out.get('sender_id'))
            if sname:
                out['sender_name'] = sname
        except Exception:
            pass
        return out
    raise HTTPException(status_code=400, detail="Erro ao enviar mensagem")

# Listar mensagens entre dois usuários
@router.get('/{user1_id}/{user2_id}', response_model=List[MessageOut])
def list_messages(user1_id: int, user2_id: int):
    result = supabase.table("messages").select("*")\
        .or_(f"sender_id.eq.{user1_id},receiver_id.eq.{user2_id}")\
        .or_(f"sender_id.eq.{user2_id},receiver_id.eq.{user1_id}")\
        .execute()
    data = result.data if result.data else []
    # attach item titles when available
    try:
        for m in data:
            iid = m.get('item_id')
            if iid:
                it = get_item(iid)
                if it:
                    m['item_title'] = it.get('title') or it.get('name')
            try:
                sname = _get_user_name(m.get('sender_id'))
                if sname:
                    m['sender_name'] = sname
            except Exception:
                pass
    except Exception:
        pass
    return data


# Mensagens envolvendo o usuário autenticado
@router.get('/me', response_model=List[MessageOut])
def my_messages(payload: dict = Depends(get_current_user_payload)):
    user_sub = payload.get('sub')
    # Busca mensagens onde o usuário é remetente ou destinatário (inclui histórico completo)
    result = supabase.table("messages").select("*")\
        .or_(f"sender_id.eq.{user_sub},receiver_id.eq.{user_sub}")\
        .execute()
    data = result.data if result.data else []
    try:
        for m in data:
            iid = m.get('item_id')
            if iid:
                it = get_item(iid)
                if it:
                    m['item_title'] = it.get('title') or it.get('name')
            try:
                sname = _get_user_name(m.get('sender_id'))
                if sname:
                    m['sender_name'] = sname
            except Exception:
                pass
    except Exception:
        pass
    return data


# Caixa de entrada: mensagens recebidas pelo usuário autenticado
@router.get('/inbox', response_model=List[MessageOut])
def my_inbox(payload: dict = Depends(get_current_user_payload)):
    user_sub = payload.get('sub')
    q = f"'{user_sub}'" if isinstance(user_sub, str) and not str(user_sub).isdigit() else f"{user_sub}"
    result = supabase.table("messages").select("id,sender_id,receiver_id,item_id,reply_to_id,content,sent_at,read,read_at").eq('receiver_id', user_sub).execute()
    data = result.data if result.data else []
    print(f'[DEBUG] Inbox data for {user_sub}: {len(data)} messages')
    if data:
        print(f'[DEBUG] First message read status: {data[0].get("read")}')
    try:
        for m in data:
            iid = m.get('item_id')
            if iid:
                it = get_item(iid)
                if it:
                    m['item_title'] = it.get('title') or it.get('name')
            try:
                sname = _get_user_name(m.get('sender_id'))
                if sname:
                    m['sender_name'] = sname
            except Exception:
                pass
    except Exception:
        pass
    return data


# Endpoint para contar mensagens não lidas
@router.get('/unread-count')
def get_unread_count(payload: dict = Depends(get_current_user_payload)):
    user_sub = payload.get('sub')
    try:
        result = supabase.table('messages').select('id', count='exact').eq('receiver_id', user_sub).eq('read', False).execute()
        count = result.count if hasattr(result, 'count') else 0
        return {'unread_count': count}
    except Exception as e:
        print(f'[DEBUG] Error getting unread count: {e}')
        return {'unread_count': 0}


# Endpoint para marcar mensagem como lida
@router.patch('/{message_id}/mark-read')
def mark_message_as_read(message_id: int, payload: dict = Depends(get_current_user_payload)):
    user_sub = payload.get('sub')
    result = supabase.table('messages').select('*').eq('id', message_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail='Mensagem não encontrada')
    message = result.data[0]
    if str(message.get('receiver_id')) != str(user_sub):
        raise HTTPException(status_code=403, detail='Você não tem permissão')
    from datetime import datetime
    supabase.table('messages').update({'read': True, 'read_at': datetime.utcnow().isoformat()}).eq('id', message_id).execute()
    return {'detail': 'Mensagem marcada como lida'}
