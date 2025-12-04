from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from app.supabase_client import supabase
from typing import List
from app.routers.auth import get_current_user_payload
from app.crud_supabase import get_item
from app import schemas
import os


router = APIRouter()


# Upload de foto de item (rota de exemplo mantendo compatibilidade)
@router.post('/upload/{item_id}')
def upload_photo(item_id: int, file: UploadFile = File(...)):
    # Mantém comportamento legacy: NÃO faz upload real aqui.
    url = f"https://fake-storage.supabase.co/{file.filename}"
    result = supabase.table("item_photos").insert({"item_id": item_id, "url": url}).execute()
    if result.data:
        return result.data[0]
    raise HTTPException(status_code=400, detail="Erro ao salvar foto")


# Salva uma URL já disponível (frontend faz upload ao Storage e envia a URL aqui)
@router.post('/save-url')
def save_photo_url(photo: schemas.PhotoCreate, payload: dict = Depends(get_current_user_payload)):
    # Verifica se o item existe e pertence ao usuário
    item = get_item(photo.item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    owner_sub = payload.get('sub')
    if str(item.get('owner_id')) != str(owner_sub):
        raise HTTPException(status_code=403, detail="Você não tem permissão para adicionar foto a este item")

    # Verifica se a service role key está disponível no processo
    if not os.getenv('SUPABASE_SERVICE_KEY'):
        # Se a chave não estiver disponível, operações que requerem bypass de RLS podem falhar
        raise HTTPException(status_code=500, detail=("SUPABASE_SERVICE_KEY não encontrada no servidor. "
                                                     "Defina SUPABASE_SERVICE_KEY no backend e reinicie o servidor."))

    try:
        result = supabase.table("item_photos").insert({"item_id": photo.item_id, "url": photo.url}).execute()
    except Exception as e:
        msg = str(e).lower()
        if 'row-level' in msg or 'row level' in msg or 'row-level security' in msg:
            raise HTTPException(status_code=403, detail=("Operação bloqueada por Row-Level Security. "
                                                        "Garanta que o backend está usando SUPABASE_SERVICE_KEY ou ajuste as policies no Supabase."))
        raise HTTPException(status_code=500, detail=f"Erro ao salvar foto: {str(e)}")

    if result.data:
        return result.data[0]
    raise HTTPException(status_code=400, detail="Erro ao salvar foto")


# Listar fotos de um item
@router.get('/{item_id}', response_model=List[str])
def list_photos(item_id: int):
    result = supabase.table("item_photos").select("url").eq("item_id", item_id).execute()
    return [r["url"] for r in result.data] if result.data else []


@router.post('/upload-and-save/{item_id}')
def upload_and_save_photo(item_id: int, file: UploadFile = File(...), payload: dict = Depends(get_current_user_payload)):
    """Recebe arquivo multipart, faz upload ao Storage com a service key e salva a URL em item_photos."""
    # Verifica item e propriedade
    item = get_item(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    owner_sub = payload.get('sub')
    if str(item.get('owner_id')) != str(owner_sub):
        raise HTTPException(status_code=403, detail="Você não tem permissão para adicionar foto a este item")

    if not os.getenv('SUPABASE_SERVICE_KEY'):
        raise HTTPException(status_code=500, detail="SUPABASE_SERVICE_KEY não configurada no backend")

    # Gera filename único
    ext = (file.filename.split('.')[-1] if file.filename and '.' in file.filename else 'jpg')
    file_name = f"item_{item_id}_{int(__import__('time').time())}.{ext}"

    try:
        # Leia os bytes do arquivo enviado (SpooledTemporaryFile) e envie como bytes
        file.file.seek(0)
        file_bytes = file.file.read()
        upload_res = supabase.storage.from_('item-photos').upload(file_name, file_bytes)
        # Alguns adaptadores retornam dict com 'error'
        if isinstance(upload_res, dict) and upload_res.get('error'):
            raise Exception(upload_res.get('error'))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao enviar arquivo para Storage: {str(e)}")

    # Tenta obter URL pública
    try:
        get_url_res = supabase.storage.from_('item-photos').get_public_url(file_name)
        public_url = None
        # supabase-py pode retornar dict com 'publicUrl' ou similar
        if isinstance(get_url_res, dict):
            public_url = get_url_res.get('publicUrl') or get_url_res.get('public_url') or get_url_res.get('data', {}).get('publicUrl')
        else:
            # fallback
            public_url = None
    except Exception:
        public_url = None

    if not public_url:
        # se não obteve public url, constrói a URL pública padrão
        public_url = f"{os.getenv('SUPABASE_URL').rstrip('/')}/storage/v1/object/public/item-photos/{file_name}"

    # Insere metadado na tabela
    try:
        result = supabase.table('item_photos').insert({'item_id': item_id, 'url': public_url}).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao salvar metadado da foto: {str(e)}")

    if result.data:
        return result.data[0]
    raise HTTPException(status_code=500, detail='Erro desconhecido ao salvar foto')
