from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.auth import router as auth_router
from app.api.v1.chat import router as chat_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.notes import router as notes_router
from app.api.v1.quizzes import router as quizzes_router
from app.api.v1.summaries import router as summaries_router
from app.api.v1.videos import router as videos_router
from app.config import settings
from app.core.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite/Postgres tables
    init_db()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
api_v1_prefix = settings.API_V1_STR
app.include_router(auth_router, prefix=api_v1_prefix)
app.include_router(videos_router, prefix=api_v1_prefix)
app.include_router(chat_router, prefix=api_v1_prefix)
app.include_router(summaries_router, prefix=api_v1_prefix)
app.include_router(notes_router, prefix=api_v1_prefix)
app.include_router(quizzes_router, prefix=api_v1_prefix)
app.include_router(dashboard_router, prefix=api_v1_prefix)


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.VERSION,
    }


@app.get("/")
def root():
    return {
        "message": f"Welcome to {settings.APP_NAME} API. Visit /docs for Swagger documentation.",
        "version": settings.VERSION,
    }
