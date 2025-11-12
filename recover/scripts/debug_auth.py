#!/usr/bin/env python3
"""
Script de debug para checar variáveis de ambiente do Supabase e decodificar um JWT.

Uso:
  python scripts/debug_auth.py <token>
ou
  set DEBUG_TOKEN=<token>; python scripts/debug_auth.py

Este script não envia nada à rede — apenas lê variáveis locais e tenta decodificar o token
usando as chaves/secret presentes no ambiente.
"""
import os
import sys
from dotenv import load_dotenv
import jwt


def print_env(name):
    v = os.getenv(name)
    print(f"{name}:", "SET" if v else "NOT SET")
    if v and len(v) < 80:
        print(f"  value: {v}")
    elif v:
        print(f"  value: <{len(v)} chars>")


def try_decode(token):
    secret = os.getenv('SUPABASE_JWT_SECRET')
    pub = os.getenv('SUPABASE_JWT_PUBLIC_KEY')
    print('\nTentando decodificar token...')
    if secret:
        try:
            payload = jwt.decode(token, secret, algorithms=["HS256"], options={"verify_aud": False})
            print('Decodificado com SUPABASE_JWT_SECRET (HS256):')
            print(payload)
            return
        except Exception as e:
            print('HS256 decode falhou:', e)
    if pub:
        try:
            payload = jwt.decode(token, pub, algorithms=["RS256"], options={"verify_aud": False})
            print('Decodificado com SUPABASE_JWT_PUBLIC_KEY (RS256):')
            print(payload)
            return
        except Exception as e:
            print('RS256 decode falhou:', e)
    print('Não foi possível decodificar o token com as chaves encontradas.')


def main():
    load_dotenv()
    print('--- Verificando variáveis de ambiente do backend ---')
    print_env('SUPABASE_URL')
    print_env('SUPABASE_KEY')
    print_env('SUPABASE_JWT_SECRET')
    print_env('SUPABASE_JWT_PUBLIC_KEY')

    token = None
    if len(sys.argv) > 1:
        token = sys.argv[1]
    else:
        token = os.getenv('DEBUG_TOKEN')

    if not token:
        print('\nNenhum token fornecido. Para testar, passe o token como argumento ou defina DEBUG_TOKEN no ambiente.')
        return

    try_decode(token)


if __name__ == '__main__':
    main()
