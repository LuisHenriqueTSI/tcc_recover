"""
Script de teste para verificar se a notificação está funcionando
Execute este script após registrar um item e aguardar 1 minuto
"""

import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

API_URL = "http://localhost:8000"
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Primeiro, faça login para obter o token
print("=" * 50)
print("TESTE DE NOTIFICAÇÃO DE ITENS")
print("=" * 50)

# Substitua com suas credenciais
email = input("Digite seu email: ")
password = input("Digite sua senha: ")

# Login via Supabase diretamente
print("\n1. Fazendo login via Supabase...")
supabase_login_response = requests.post(
    f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
    json={"email": email, "password": password},
    headers={"apikey": SUPABASE_KEY, "Content-Type": "application/json"}
)

if supabase_login_response.status_code != 200:
    print(f"❌ Erro no login: {supabase_login_response.text}")
    exit(1)

login_data = supabase_login_response.json()
token = login_data.get("access_token")
print(f"✅ Login bem-sucedido! Token: {token[:20]}...")

headers = {"Authorization": f"Bearer {token}"}

# Verificar se o campo resolved existe
print("\n2. Verificando se o campo 'resolved' existe na tabela...")
check_response = requests.get(f"{API_URL}/publications/debug/check-resolved-field")
print(f"Status: {check_response.status_code}")
print(f"Resposta: {json.dumps(check_response.json(), indent=2)}")

# Buscar itens pendentes de notificação
print("\n3. Buscando itens pendentes de notificação...")
pending_response = requests.get(f"{API_URL}/publications/pending-notification", headers=headers)
print(f"Status: {pending_response.status_code}")

if pending_response.status_code == 200:
    pending_items = pending_response.json()
    print(f"✅ Encontrados {len(pending_items)} itens pendentes:")
    for item in pending_items:
        print(f"  - ID: {item.get('id')}, Título: {item.get('title')}, Criado em: {item.get('created_at')}")
    
    if len(pending_items) == 0:
        print("\n⚠️ ATENÇÃO: Nenhum item pendente encontrado!")
        print("Isso pode significar:")
        print("  1. Você não tem itens registrados")
        print("  2. Seus itens foram criados há menos de 1 minuto")
        print("  3. Todos os seus itens já foram marcados como resolvidos")
else:
    print(f"❌ Erro: {pending_response.text}")

# Buscar todos os seus itens
print("\n4. Listando TODOS os itens do sistema (para verificação)...")
all_items_response = requests.get(f"{API_URL}/publications/")
if all_items_response.status_code == 200:
    all_items = all_items_response.json()
    print(f"Total de itens no sistema: {len(all_items)}")
    
    # Obter user ID do token
    user_id = login_data.get("user", {}).get("id")
    my_items = [item for item in all_items if str(item.get("owner_id")) == str(user_id)]
    print(f"Seus itens: {len(my_items)}")
    
    for item in my_items:
        print(f"  - ID: {item.get('id')}, Título: {item.get('title')}")
        print(f"    Criado em: {item.get('created_at')}")
        print(f"    Resolvido: {item.get('resolved', 'N/A')}")
    
print("\n" + "=" * 50)
print("TESTE CONCLUÍDO")
print("=" * 50)
