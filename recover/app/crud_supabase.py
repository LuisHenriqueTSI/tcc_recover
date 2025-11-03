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
