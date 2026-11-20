import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

# Search and load .env from root or current dir
ROOT_DIR = Path(__file__).resolve().parents[2]
for env_path in [
    ROOT_DIR / ".env",
    ROOT_DIR / "rag based ai project" / ".env",
    ROOT_DIR / "rag based ai project" / "week3" / "ytscraper" / ".env",
]:
    if env_path.exists():
        load_dotenv(env_path, override=False)


class Settings(BaseSettings):
    APP_NAME: str = "Padho with Girish AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./learning_assistant.db")

    # Security
    JWT_SECRET: str = os.getenv(
        "JWT_SECRET",
        "yt-learning-assistant-jwt-secret-key-production-grade-2026-secure",
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # AI & Vector DB
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    QDRANT_URL: str = os.getenv("QDRANT_URL", "")
    QDRANT_API_KEY: str = os.getenv("QDRANT_API_KEY", "")
    HF_TOKEN: str = os.getenv("HF_TOKEN", "")

    # LLM Settings
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    FALLBACK_GROQ_MODEL: str = "openai/gpt-oss-120b"
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    EMBEDDING_DIM: int = 384
    QDRANT_COLLECTION: str = os.getenv("QDRANT_COLLECTION", "yt_learning_assistant")

    # CORS
    CORS_ORIGINS: list[str] = ["*"]

    model_config = SettingsConfigDict(case_sensitive=True)


settings = Settings()
