from fastapi import APIRouter, HTTPException
from app.supabase_client import supabase
from typing import List

router = APIRouter()

# Listar categorias
@router.get('/', response_model=List[str])
def list_categories():
    result = supabase.table("categories").select("name").execute()
    return [r["name"] for r in result.data] if result.data else []

# Adicionar categoria (admin)
@router.post('/')
def add_category(name: str):
    result = supabase.table("categories").insert({"name": name}).execute()
    if result.data:
        return result.data[0]
    raise HTTPException(status_code=400, detail="Erro ao adicionar categoria")
