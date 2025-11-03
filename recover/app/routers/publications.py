
from fastapi import APIRouter, Depends, HTTPException, status
import os
from app import schemas
from app.crud_supabase import create_item, get_all_items, delete_item, get_item, get_items_by_owner, update_items_owner, update_item
from app.routers.auth import get_current_user_payload
from typing import List

router = APIRouter()

# Exemplo: criar publicação usando Supabase
@router.post('/', response_model=schemas.PublicationOut)
def create_publication(publication: schemas.PublicationCreate, payload: dict = Depends(get_current_user_payload)):
    item_data = publication.dict()
    # Define owner_id a partir do token do usuário autenticado
    owner_sub = payload.get("sub")
    # Salva owner_id como string para ser consistente com o JWT 'sub' (tolerante a UUIDs)
    item_data["owner_id"] = str(owner_sub)
    result = create_item(item_data)
    if not result:
        raise HTTPException(status_code=400, detail="Erro ao criar publicação")
    return result[0] if isinstance(result, list) else result

# Exemplo: listar publicações usando Supabase
@router.get('/', response_model=List[schemas.PublicationOut])
def list_publications():
    items = get_all_items()
    return items if items else []


# Rota para deletar uma publicação/item pelo id
@router.delete('/{item_id}')
def delete_publication(item_id: int, payload: dict = Depends(get_current_user_payload)):
    # Busca o item e verifica existência
    item = get_item(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")

    owner_sub = payload.get("sub")
    # comparar como string para ser tolerante a tipos (int vs str)
    if str(item.get("owner_id")) != str(owner_sub):
        # Se estiver em modo DEBUG, incluímos valores para facilitar diagnóstico
        if os.getenv("DEBUG", "").lower() in ("1", "true", "yes"):
            detail = f"Permissão negada. owner_id={item.get('owner_id')} sub={owner_sub}"
        else:
            detail = "Você não tem permissão para deletar este item"
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=detail)

    result = delete_item(item_id)
    if not result:
        raise HTTPException(status_code=500, detail="Erro ao deletar item")
    return {"detail": "Item deletado"}


@router.put('/{item_id}', response_model=schemas.PublicationOut)
def update_publication(item_id: int, publication: schemas.PublicationCreate, payload: dict = Depends(get_current_user_payload)):
    # Busca o item e verifica existência
    item = get_item(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")

    owner_sub = payload.get("sub")
    if str(item.get("owner_id")) != str(owner_sub):
        if os.getenv("DEBUG", "").lower() in ("1", "true", "yes"):
            detail = f"Permissão negada ao atualizar. owner_id={item.get('owner_id')} sub={owner_sub}"
        else:
            detail = "Você não tem permissão para atualizar este item"
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=detail)

    update_data = publication.dict()
    result = update_item(item_id, update_data)
    if not result:
        raise HTTPException(status_code=500, detail="Erro ao atualizar item")
    return result[0] if isinstance(result, list) else result


# Endpoint para pré-visualizar quais itens seriam migrados do placeholder para o seu sub
@router.get('/migrate-preview', response_model=List[schemas.PublicationOut])
def migrate_preview(placeholder: str = '1', payload: dict = Depends(get_current_user_payload)):
    items = get_items_by_owner(str(placeholder))
    return items if items else []


# Endpoint para migrar owner_id = placeholder para o sub do usuário autenticado
@router.post('/migrate-owner')
def migrate_owner(placeholder: str = '1', payload: dict = Depends(get_current_user_payload)):
    owner_sub = str(payload.get('sub'))
    items = get_items_by_owner(str(placeholder))
    if not items:
        return {"detail": "Nenhum item para migrar", "migrated": 0}

    result = update_items_owner(str(placeholder), owner_sub)
    migrated_count = len(result) if result else 0
    migrated_ids = [r.get('id') for r in result] if result else []
    return {"detail": f"{migrated_count} itens migrados", "migrated": migrated_count, "migrated_ids": migrated_ids}
