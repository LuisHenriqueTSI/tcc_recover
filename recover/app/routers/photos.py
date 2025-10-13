from fastapi import APIRouter, HTTPException, UploadFile, File
from app.supabase_client import supabase
from typing import List

router = APIRouter()

# Upload de foto de item
@router.post('/upload/{item_id}')
def upload_photo(item_id: int, file: UploadFile = File(...)):
    # Exemplo: salvar arquivo no Supabase Storage (implementar integração real)
    # Aqui apenas salva a URL fictícia na tabela
    url = f"https://fake-storage.supabase.co/{file.filename}"
    result = supabase.table("item_photos").insert({"item_id": item_id, "url": url}).execute()
    if result.data:
        return result.data[0]
    raise HTTPException(status_code=400, detail="Erro ao salvar foto")

# Listar fotos de um item
@router.get('/{item_id}', response_model=List[str])
def list_photos(item_id: int):
    result = supabase.table("item_photos").select("url").eq("item_id", item_id).execute()
    return [r["url"] for r in result.data] if result.data else []
