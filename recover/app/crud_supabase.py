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
# def delete_item(item_id: int):
#     response = supabase.table("items").delete().eq("id", item_id).execute()
#     return response.data
