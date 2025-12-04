
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
import jwt
import os
import time
from datetime import datetime



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
