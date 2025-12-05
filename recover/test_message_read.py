"""
Script de teste para verificar se a coluna 'read' existe na tabela messages
Execute antes de usar o sistema de mensagens não lidas
"""

import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("=" * 60)
print("TESTE DE CAMPO 'READ' NA TABELA MESSAGES")
print("=" * 60)

try:
    # Tentar buscar mensagens com o campo 'read'
    print("\nTentando buscar mensagens com o campo 'read'...")
    result = supabase.table('messages').select('id, read, read_at').limit(1).execute()
    
    if result.data or result.data == []:
        print("✅ Campo 'read' existe na tabela messages!")
        print(f"   Resposta: {result.data}")
    else:
        print("❌ Não foi possível verificar o campo 'read'")
        
except Exception as e:
    error_msg = str(e)
    if 'column "read" does not exist' in error_msg or 'column "read_at" does not exist' in error_msg:
        print("❌ ERRO: Coluna 'read' ou 'read_at' NÃO existe na tabela messages!")
        print("\n⚠️  AÇÃO NECESSÁRIA:")
        print("   Execute o script SQL no Supabase Dashboard:")
        print("   scripts/add_message_read_field.sql")
    else:
        print(f"❌ Erro inesperado: {error_msg}")

print("\n" + "=" * 60)
