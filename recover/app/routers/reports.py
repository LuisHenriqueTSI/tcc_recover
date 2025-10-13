from fastapi import APIRouter, HTTPException
from app.supabase_client import supabase
from pydantic import BaseModel
from typing import List

router = APIRouter()

class ReportCreate(BaseModel):
    reporter_id: int
    item_id: int
    reason: str

class ReportOut(BaseModel):
    id: int
    reporter_id: int
    item_id: int
    reason: str
    created_at: str

# Criar denúncia
@router.post('/', response_model=ReportOut)
def create_report(report: ReportCreate):
    result = supabase.table("reports").insert(report.dict()).execute()
    if result.data:
        return result.data[0]
    raise HTTPException(status_code=400, detail="Erro ao criar denúncia")

# Listar denúncias (admin)
@router.get('/', response_model=List[ReportOut])
def list_reports():
    result = supabase.table("reports").select("*").execute()
    return result.data if result.data else []
