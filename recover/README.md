

# Recover - Sistema de Achados e Perdidos

## Descrição
Backend em FastAPI integrado ao Supabase para gerenciamento de itens perdidos/encontrados, usuários, chat, fotos, categorias e denúncias.

## Estrutura
```
recover/
├── app/
│   ├── main.py
│   ├── supabase_client.py
│   ├── crud_supabase.py
│   ├── schemas.py
│   ├── routers/
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── publications.py
│   │   ├── photos.py
│   │   ├── chat.py
│   │   ├── categories.py
│   │   ├── reports.py
│   │   └── __init__.py
├── .env
├── requirements.txt
├── README.md
```

## Instalação
1. Clone o repositório
2. Crie e ative o ambiente virtual
3. Instale as dependências:
   ```
   pip install -r requirements.txt
   ```
4. Configure o arquivo `.env` com as credenciais do Supabase

## Execução
```bash
uvicorn app.main:app --reload
```
Acesse a documentação interativa em [http://localhost:8000/docs](http://localhost:8000/docs)

## Funcionalidades
- Cadastro/login de usuários
- Registro e busca de itens
- Upload de fotos
- Chat entre usuários
- Categorias
- Denúncias
- Painel administrativo

## Supabase
- Crie as tabelas conforme os exemplos SQL fornecidos
- Ative e configure as políticas de Row Level Security
- Use a `SERVICE_ROLE_KEY` no backend

## Contato
Dúvidas ou sugestões: [Seu email ou GitHub]
