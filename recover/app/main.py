from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.auth import router as auth_router
from app.routers.publications import router as publications_router
from app.routers.photos import router as photos_router
from app.routers.chat import router as chat_router
from app.routers.categories import router as categories_router
from app.routers.reports import router as reports_router

from fastapi.responses import Response

app = FastAPI(title='Recover - API')
@app.get('/favicon.ico')
def favicon():
    # Retorna um favicon vazio para evitar 404
    return Response(content=b"", media_type="image/x-icon")

# Adiciona CORS para permitir acesso do frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Ou especifique o domínio do frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router, prefix='/auth', tags=['auth'])
app.include_router(publications_router, prefix='/publications', tags=['publications'])
app.include_router(photos_router, prefix='/photos', tags=['photos'])
app.include_router(chat_router, prefix='/chat', tags=['chat'])
app.include_router(categories_router, prefix='/categories', tags=['categories'])
app.include_router(reports_router, prefix='/reports', tags=['reports'])

@app.get("/")
def root():
    return {"message": "Welcome to Recover API"}

@app.get('/ping')
def ping():
    return {'status':'ok'}
