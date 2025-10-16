
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
import jwt
import os



# Dependência para extrair user_id do token JWT
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
def get_current_user_payload(credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())):
	token = credentials.credentials
	JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
	JWT_PUBLIC_KEY = os.getenv("SUPABASE_JWT_PUBLIC_KEY")
	try:
		payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
		return payload
	except Exception:
		if JWT_PUBLIC_KEY:
			try:
				payload = jwt.decode(token, JWT_PUBLIC_KEY, algorithms=["RS256"])
				return payload
			except Exception:
				raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido (RS256)")
		else:
			raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

router = APIRouter()

# Endpoint para retornar dados do usuário autenticado
@router.get('/me')
def get_me(payload: dict = Depends(get_current_user_payload)):
	user_id = payload.get("sub")
	email = payload.get("email", "(email não disponível)")
	name = payload.get("name", "Usuário")
	return {"id": user_id, "email": email, "name": name}
