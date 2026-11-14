import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "TalentIQ AI"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Firebase Configuration
    FIREBASE_PROJECT_ID: str = "talentiq-ai"
    FIREBASE_CREDENTIALS_PATH: str = ""
    FIREBASE_DATABASE_URL: str = ""

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://talentiq-ai.web.app",
        "https://talentiq-ai.firebaseapp.com",
    ]

    # File storage
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "storage", "uploads")
    TEMP_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "storage", "temp")
    MAX_UPLOAD_SIZE_BYTES: int = 15 * 1024 * 1024  # 15 MB
    ALLOWED_MIME_TYPES: List[str] = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
    ]

    # External LLM (Optional - rule-based fallback used if empty)
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""

    # Default Criteria Weights
    DEFAULT_REQUIRED_SKILLS_WEIGHT: float = 40.0
    DEFAULT_EXPERIENCE_WEIGHT: float = 25.0
    DEFAULT_PROJECTS_WEIGHT: float = 20.0
    DEFAULT_EDUCATION_CERTS_WEIGHT: float = 15.0

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Ensure storage directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.TEMP_DIR, exist_ok=True)
