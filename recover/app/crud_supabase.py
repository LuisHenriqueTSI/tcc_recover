from app.supabase_client import supabase

# Exemplo: Buscar todos os itens da tabela 'items'
def get_all_items():
    response = supabase.table("items").select("*").execute()
    return response.data

# Exemplo: Inserir um novo item na tabela 'items'
def create_item(item_data: dict):
    response = supabase.table("items").insert(item_data).execute()
    return response.data

# Exemplo: Atualizar um item
# def update_item(item_id: int, update_data: dict):
#     response = supabase.table("items").update(update_data).eq("id", item_id).execute()
#     return response.data

# Exemplo: Deletar um item
def delete_item(item_id: int):
    """Deleta um item da tabela 'items' pelo id.

    Retorna os dados deletados (lista ou None) conforme o retorno do Supabase.
    """
    # Primeiro deletar dependências que referenciam o item para evitar violação
    # da constraint de foreign key.
    # Se preferir, configure as FKs no banco com ON DELETE CASCADE (ver notas abaixo).
    supabase.table("messages").delete().eq("item_id", item_id).execute()
    supabase.table("item_photos").delete().eq("item_id", item_id).execute()

    response = supabase.table("items").delete().eq("id", item_id).execute()
    return response.data


def get_item(item_id: int):
    """Retorna um item pelo id (ou None se não existir)."""
    response = supabase.table("items").select("*").eq("id", item_id).execute()
    data = response.data
    if not data:
        return None
    # Supabase geralmente retorna lista mesmo para eq
    return data[0] if isinstance(data, list) else data


def get_items_by_owner(owner):
    """Retorna lista de itens cujo owner_id é igual a `owner`."""
    response = supabase.table("items").select("*").eq("owner_id", owner).execute()
    return response.data


def update_items_owner(old_owner, new_owner):
    """Atualiza owner_id de todos os itens que têm old_owner para new_owner.

    Retorna a lista de registros atualizados conforme retorno do Supabase.
    """
    response = supabase.table("items").update({"owner_id": new_owner}).eq("owner_id", old_owner).execute()
    return response.data


def update_item(item_id: int, update_data: dict):
    """Atualiza um item por id com os dados fornecidos."""
    response = supabase.table("items").update(update_data).eq("id", item_id).execute()
    return response.data


def mark_item_as_resolved(item_id: int):
    """Marca um item como resolvido."""
    from datetime import datetime
    update_data = {
        "resolved": True,
        "resolved_at": datetime.utcnow().isoformat()
    }
    response = supabase.table("items").update(update_data).eq("id", item_id).execute()
    return response.data


def get_statistics():
    """Retorna estatísticas de itens resolvidos agrupados por categoria."""
    # Buscar todos os itens resolvidos
    response = supabase.table("items").select("category").eq("resolved", True).execute()
    
    if not response.data:
        return {"total_resolved": 0, "by_category": []}
    
    # Contar por categoria
    category_counts = {}
    for item in response.data:
        category = item.get("category") or "Outros"
        category_counts[category] = category_counts.get(category, 0) + 1
    
    by_category = [{"category": cat, "count": count} for cat, count in category_counts.items()]
    
    return {
        "total_resolved": len(response.data),
        "by_category": sorted(by_category, key=lambda x: x["count"], reverse=True)
    }


def get_items_pending_notification(owner_id: str, minutes_threshold: int = 1):
    """Retorna itens que precisam de notificação (criados há mais de X minutos e não resolvidos)."""
    from datetime import datetime, timedelta
    
    # Calcular o timestamp limite
    threshold_time = datetime.utcnow() - timedelta(minutes=minutes_threshold)
    threshold_str = threshold_time.isoformat()
    
    print(f"[DEBUG CRUD] Looking for items older than: {threshold_str}")
    print(f"[DEBUG CRUD] Owner ID: {owner_id}")
    
    # Buscar itens do usuário que não foram resolvidos e foram criados antes do threshold
    response = supabase.table("items").select("*").eq("owner_id", str(owner_id)).eq("resolved", False).lt("created_at", threshold_str).execute()
    
    print(f"[DEBUG CRUD] Query result: {len(response.data) if response.data else 0} items")
    if response.data:
        for item in response.data:
            print(f"[DEBUG CRUD] Item {item.get('id')}: title={item.get('title')}, created_at={item.get('created_at')}")
    
    return response.data if response.data else []
