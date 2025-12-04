
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
import jwt
import os
import time
from datetime import datetime
from app.supabase_client import supabase



# Dependência para extrair user_id do token JWT
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
def get_current_user_payload(credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())):
	token = credentials.credentials
	# Print token repr to detect hidden characters/newlines
	print(f"[DEBUG] Token recebido (repr): {repr(token)} len={len(token)}")
	JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
	JWT_PUBLIC_KEY = os.getenv("SUPABASE_JWT_PUBLIC_KEY")
	# Try to decode without verification to inspect iat/exp for debugging and clock skew
	try:
		raw = jwt.decode(token, options={"verify_signature": False})
		iat = raw.get('iat')
		exp = raw.get('exp')
		print(f"[DEBUG] token payload preview iat={iat} exp={exp} server_time={int(time.time())} ({datetime.utcfromtimestamp(int(time.time())).isoformat()}Z)")
	except Exception as e_preview:
		print('[DEBUG] preview decode failed:', repr(str(e_preview)))

	# Allow small leeway for clock skew between auth provider and this server
	leeway_seconds = 10
	try:
		payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"], options={"verify_aud": False}, leeway=leeway_seconds)
		return payload
	except Exception as e_hs:
		print('[DEBUG] HS256 decode failed:', repr(str(e_hs)))
		# If a public key is available, try RS256 with same leeway
		if JWT_PUBLIC_KEY:
			try:
				payload = jwt.decode(token, JWT_PUBLIC_KEY, algorithms=["RS256"], leeway=leeway_seconds)
				return payload
			except Exception as e_rs:
				print('[DEBUG] RS256 decode failed:', repr(str(e_rs)))
				raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido (RS256)")
		# No public key or RS decode failed
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

router = APIRouter()

# Endpoint para retornar dados do usuário autenticado
@router.get('/me')
def get_me(payload: dict = Depends(get_current_user_payload)):
	user_id = payload.get("sub")
	email = payload.get("email", "(email não disponível)")
	name = payload.get("name", "Usuário")
	return {"id": user_id, "email": email, "name": name}


# Buscar perfil público de um usuário por id/sub
@router.get('/users/{user_id}')
def get_user_profile(user_id: str):
	# tenta buscar nas tabelas de perfil (profiles) ou users no Supabase
	try:
		# primeiro tenta na tabela `profiles`
		resp = supabase.table('profiles').select('id,name,full_name,display_name,email').eq('id', str(user_id)).execute()
		if resp and getattr(resp, 'data', None):
			row = resp.data[0]
			# normalize name field
			name = row.get('full_name') or row.get('display_name') or row.get('name')
			return { 'id': row.get('id'), 'name': name or str(row.get('id')) }
	except Exception:
		pass
	try:
		# fallback: tentar tabela `users`
		resp2 = supabase.table('users').select('id,email').eq('id', str(user_id)).execute()
		if resp2 and getattr(resp2, 'data', None):
			row = resp2.data[0]
			return { 'id': row.get('id'), 'name': row.get('email') or str(row.get('id')) }
	except Exception:
		pass
	# se nada encontrado, retornar id como nome
	return { 'id': user_id, 'name': str(user_id) }



# Endpoint para sincronizar/atualizar profile do usuário (exige token)
@router.post('/sync-profile')
def sync_profile(body: dict, payload: dict = Depends(get_current_user_payload)):
	name = body.get('name')
	if not name:
		raise HTTPException(status_code=400, detail='Missing name')
	user_sub = payload.get('sub')
	try:
		# usa service role key pelo supabase client configurado no backend
		resp = supabase.table('profiles').upsert({'id': str(user_sub), 'name': name}).execute()
		if getattr(resp, 'error', None):
			raise Exception(resp.error)
		return {'ok': True, 'profile': resp.data}
	except Exception as e:
		raise HTTPException(status_code=500, detail=f'Failed to upsert profile: {e}')
