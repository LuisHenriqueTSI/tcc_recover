"""
Script para testar o sistema de mensagens não lidas
"""

import requests
import os
from dotenv import load_dotenv

load_dotenv()

API_URL = "http://localhost:8000"
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

print("=" * 60)
print("TESTE COMPLETO DE MENSAGENS NÃO LIDAS")
print("=" * 60)

# Login
email = input("\nDigite seu email: ")
password = input("Digite sua senha: ")

print("\n1. Fazendo login...")
supabase_login_response = requests.post(
    f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
    json={"email": email, "password": password},
    headers={"apikey": SUPABASE_KEY, "Content-Type": "application/json"}
)

if supabase_login_response.status_code != 200:
    print(f"❌ Erro no login: {supabase_login_response.text}")
    exit(1)

token = supabase_login_response.json().get("access_token")
print(f"✅ Login bem-sucedido!")

headers = {"Authorization": f"Bearer {token}"}

# Verificar mensagens não lidas
print("\n2. Verificando mensagens não lidas...")
unread_response = requests.get(f"{API_URL}/chat/unread-count", headers=headers)
print(f"Status: {unread_response.status_code}")
if unread_response.status_code == 200:
    unread_data = unread_response.json()
    print(f"✅ Mensagens não lidas: {unread_data.get('unread_count', 0)}")
else:
    print(f"❌ Erro: {unread_response.text}")

# Listar mensagens do inbox
print("\n3. Listando mensagens do inbox...")
inbox_response = requests.get(f"{API_URL}/chat/inbox", headers=headers)
if inbox_response.status_code == 200:
    messages = inbox_response.json()
    print(f"✅ Total de mensagens: {len(messages)}")
    for msg in messages:
        status = "🔵 NÃO LIDA" if msg.get('read') == False else "✅ LIDA"
        print(f"   - ID {msg['id']}: {status} - De: {msg.get('sender_name', msg['sender_id'])} - {msg['content'][:50]}...")
else:
    print(f"❌ Erro ao buscar inbox: {inbox_response.text}")

print("\n" + "=" * 60)
