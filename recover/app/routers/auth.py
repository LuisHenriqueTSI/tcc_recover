
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
import jwt
import os
import time
from datetime import datetime
from app.supabase_client import supabase
from app.schemas import UserSocialMediaUpdate



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
	
	# Buscar informações adicionais do perfil no banco
	try:
		resp = supabase.table('profiles').select('*').eq('id', str(user_id)).execute()
		if resp and getattr(resp, 'data', None) and len(resp.data) > 0:
			profile = resp.data[0]
			return {
				"id": user_id,
				"email": email,
				"name": profile.get('name') or name,
				"phone": profile.get('phone'),
				"instagram": profile.get('instagram'),
				"twitter": profile.get('twitter'),
				"whatsapp": profile.get('whatsapp'),
				"facebook": profile.get('facebook'),
				"linkedin": profile.get('linkedin'),
				"avatar": profile.get('avatar')
			}
	except Exception as e:
		print(f"[DEBUG] Erro ao buscar perfil: {e}")
	
	# Se não encontrou no banco, retorna dados básicos do token
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
	user_email = payload.get('email')
	
	try:
		# Preparar dados do perfil
		profile_data = {
			'id': str(user_sub),
			'name': name,
			'email': user_email,
			'updated_at': datetime.utcnow().isoformat()
		}
		
		# usa service role key pelo supabase client configurado no backend
		resp = supabase.table('profiles').upsert(profile_data).execute()
		if getattr(resp, 'error', None):
			raise Exception(resp.error)
		return {'ok': True, 'profile': resp.data}
	except Exception as e:
		raise HTTPException(status_code=500, detail=f'Failed to upsert profile: {e}')


# Endpoint para atualizar redes sociais do usuário
@router.post('/update-social-media')
def update_social_media(body: UserSocialMediaUpdate, payload: dict = Depends(get_current_user_payload)):
	user_id = payload.get('sub')
	user_email = payload.get('email')
	
	try:
		# Primeiro, garantir que o perfil existe
		check_resp = supabase.table('profiles').select('id').eq('id', str(user_id)).execute()
		profile_exists = check_resp and getattr(check_resp, 'data', None) and len(check_resp.data) > 0
		
		# Preparar dados para atualizar (apenas campos fornecidos)
		update_data = {'id': str(user_id)}
		
		if not profile_exists:
			# Se perfil não existe, incluir campos obrigatórios
			update_data['email'] = user_email
			update_data['name'] = payload.get('name', 'Usuário')
		
		if body.instagram is not None:
			update_data['instagram'] = body.instagram
		if body.twitter is not None:
			update_data['twitter'] = body.twitter
		if body.whatsapp is not None:
			update_data['whatsapp'] = body.whatsapp
		if body.facebook is not None:
			update_data['facebook'] = body.facebook
		if body.linkedin is not None:
			update_data['linkedin'] = body.linkedin
		if body.phone is not None:
			update_data['phone'] = body.phone
		
		update_data['updated_at'] = datetime.utcnow().isoformat()
		
		# Usar upsert para criar ou atualizar
		if profile_exists:
			resp = supabase.table('profiles').update(update_data).eq('id', str(user_id)).execute()
		else:
			resp = supabase.table('profiles').upsert(update_data).execute()
			
		if getattr(resp, 'error', None):
			raise Exception(resp.error)
		return {'ok': True, 'data': resp.data}
	except Exception as e:
		raise HTTPException(status_code=500, detail=f'Erro ao atualizar redes sociais: {str(e)}')


# Endpoint para buscar redes sociais de um usuário (público)
@router.get('/users/{user_id}/social-media')
def get_user_social_media(user_id: str):
	try:
		resp = supabase.table('profiles').select('instagram,twitter,whatsapp,facebook,linkedin,phone').eq('id', str(user_id)).execute()
		if resp and getattr(resp, 'data', None) and len(resp.data) > 0:
			return resp.data[0]
		return {
			'instagram': None,
			'twitter': None,
			'whatsapp': None,
			'facebook': None,
			'linkedin': None,
			'phone': None
		}
	except Exception as e:
		raise HTTPException(status_code=500, detail=f'Erro ao buscar redes sociais: {str(e)}')
