
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
import jwt
import os



# Dependência para extrair user_id do token JWT
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
def get_current_user_payload(credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())):
	token = credentials.credentials
	token = credentials.credentials
	print(f"[DEBUG] Token recebido: {token}")
	# Print unverified header and payload for debugging (no signature verification)
	try:
		header = jwt.get_unverified_header(token)
		print('[DEBUG] JWT header (unverified):', header)
	except Exception as e:
		print('[DEBUG] failed to parse JWT header:', e)
	try:
		unverified_payload = jwt.decode(token, options={"verify_signature": False})
		print('[DEBUG] JWT payload (unverified):', unverified_payload)
	except Exception as e:
		print('[DEBUG] failed to parse JWT payload (unverified):', e)

	JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
	JWT_PUBLIC_KEY = os.getenv("SUPABASE_JWT_PUBLIC_KEY")
	print(f"[DEBUG] SUPABASE_JWT_SECRET set: {bool(JWT_SECRET)}; SUPABASE_JWT_PUBLIC_KEY set: {bool(JWT_PUBLIC_KEY)}")

	# Try HS256 (HMAC) first if secret is available
	if JWT_SECRET:
		try:
			# Allow small clock skew between machines (leeway seconds)
			payload = jwt.decode(
				token,
				JWT_SECRET,
				algorithms=["HS256"],
				options={"verify_aud": False},
				leeway=60,
			)
			print('[DEBUG] JWT validated with HS256')
			return payload
		except Exception as e:
			print('[DEBUG] HS256 validation failed:', repr(e))

	# If HS256 failed or no secret, try RS256 with public key
	if JWT_PUBLIC_KEY:
		try:
			# Allow small clock skew when validating RS256 tokens as well
			payload = jwt.decode(
				token,
				JWT_PUBLIC_KEY,
				algorithms=["RS256"],
				options={"verify_aud": False},
				leeway=60,
			)
			print('[DEBUG] JWT validated with RS256 (public key)')
			return payload
		except Exception as e:
			print('[DEBUG] RS256 validation failed:', repr(e))

	# If we reach here, report unauthorized (debug info printed above)
	raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

router = APIRouter()

# Endpoint para retornar dados do usuário autenticado
@router.get('/me')
def get_me(payload: dict = Depends(get_current_user_payload)):
	user_id = payload.get("sub")
	email = payload.get("email", "(email não disponível)")
	name = payload.get("name", "Usuário")
	return {"id": user_id, "email": email, "name": name}
