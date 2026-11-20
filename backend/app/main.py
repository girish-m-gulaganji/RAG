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


from fastapi.responses import HTMLResponse

@app.get("/", response_class=HTMLResponse)
def root():
    return """
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Padho with Girish AI — Backend API</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0d11; color: #e2e8f0; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
        .card { background: #121620; border: 1px solid #232b3b; padding: 40px; border-radius: 20px; text-align: center; max-width: 480px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
        .badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; background: rgba(16,185,129,0.15); color: #34d399; border: 1px solid rgba(16,185,129,0.3); margin-bottom: 16px; }
        h1 { margin: 0 0 8px 0; font-size: 24px; color: #fff; }
        p { color: #94a3b8; font-size: 14px; margin-bottom: 24px; line-height: 1.5; }
        .btn-group { display: flex; flex-direction: column; gap: 10px; }
        .btn { display: block; padding: 12px 20px; border-radius: 12px; text-decoration: none; font-size: 14px; font-weight: 600; transition: all 0.2s; }
        .btn-primary { background: #6366f1; color: #fff; box-shadow: 0 4px 14px rgba(99,102,241,0.4); }
        .btn-primary:hover { background: #4f46e5; }
        .btn-secondary { background: #1e2533; color: #cbd5e1; border: 1px solid #2b3548; }
        .btn-secondary:hover { background: #283245; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="badge"><span style="width:8px;height:8px;border-radius:50%;background:#34d399;display:inline-block;"></span> Backend API Online</div>
        <h1>Padho with Girish AI</h1>
        <p>Production RAG engine created by Girish M. Gulaganji. Serving vectors, transcripts, and grounded AI tutor sessions.</p>
        <div class="btn-group">
          <a href="http://localhost:5173" class="btn btn-primary">Open Student Web App (Port 5173)</a>
          <a href="/docs" class="btn btn-secondary">Interactive Swagger Docs (/docs)</a>
        </div>
      </div>
    </body>
    </html>
    """
