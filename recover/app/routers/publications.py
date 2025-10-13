
from fastapi import APIRouter, Depends, HTTPException
from app import schemas
from app.crud_supabase import create_item, get_all_items
from typing import List

router = APIRouter()

# Exemplo: criar publicação usando Supabase
@router.post('/', response_model=schemas.PublicationOut)
def create_publication(publication: schemas.PublicationCreate):
    item_data = publication.dict()
    # Adicione o owner_id conforme sua lógica de autenticação
    item_data["owner_id"] = 1  # Exemplo fixo, troque pelo usuário autenticado
    result = create_item(item_data)
    if not result:
        raise HTTPException(status_code=400, detail="Erro ao criar publicação")
    return result[0] if isinstance(result, list) else result

# Exemplo: listar publicações usando Supabase
@router.get('/', response_model=List[schemas.PublicationOut])
def list_publications():
    items = get_all_items()
    return items if items else []
