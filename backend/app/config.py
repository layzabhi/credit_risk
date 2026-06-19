"""
Application configuration and settings.
Manages environment variables and application-wide settings.
"""

import os
from typing import List, Optional
from functools import lru_cache


class Settings:
    """Application settings from environment variables."""
    
    # Application
    APP_NAME: str = "Credit Risk Assessment API"
    APP_VERSION: str = "1.0"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    
    # Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", 8000))
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///./test.db"
    )
    SQLALCHEMY_ECHO: bool = DEBUG
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    ALLOWED_HOSTS: str = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1,testserver")
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:8000")
    
    # Models
    MODELS_DIR: str = os.getenv("MODELS_DIR", "./ml_models")
    PRIMARY_MODEL: str = os.getenv("PRIMARY_MODEL", "xgboost")
    
    # Feature flags
    ENABLE_SHAP_EXPLANATIONS: bool = True
    
    # Rate limiting
    
    # File storage
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")
    MAX_UPLOAD_SIZE_MB: int = 100
    
    # Cloud storage (R2, S3, etc.)
    R2_ACCOUNT_ID: Optional[str] = os.getenv("R2_ACCOUNT_ID")
    R2_ACCESS_KEY_ID: Optional[str] = os.getenv("R2_ACCESS_KEY_ID")
    R2_SECRET_ACCESS_KEY: Optional[str] = os.getenv("R2_SECRET_ACCESS_KEY")
    R2_BUCKET_NAME: Optional[str] = os.getenv("R2_BUCKET_NAME")
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FILE: Optional[str] = os.getenv("LOG_FILE")
    
    # Monitoring
    SENTRY_DSN: Optional[str] = os.getenv("SENTRY_DSN")
    DATADOG_API_KEY: Optional[str] = os.getenv("DATADOG_API_KEY")
    
    # Threshold settings
    LOW_RISK_THRESHOLD: float = float(os.getenv("LOW_RISK_THRESHOLD", "0.25"))
    MEDIUM_RISK_THRESHOLD: float = float(os.getenv("MEDIUM_RISK_THRESHOLD", "0.65"))
    
    # Model retraining
    ENABLE_AUTO_RETRAINING: bool = False
    RETRAINING_INTERVAL_DAYS: int = 30
    MIN_SAMPLES_FOR_RETRAINING: int = 1000
    
    # Feature engineering
    ENABLE_FEATURE_ENGINEERING: bool = True
    FEATURE_ENGINEERING_VERSION: str = "1.0"
    
    # Cache
    ENABLE_CACHE: bool = True
    CACHE_TTL_SECONDS: int = 3600  # 1 hour
    
    class Config:
        """Pydantic config for case-insensitive env vars."""
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """
    Get application settings (cached).
    Uses dependency injection in FastAPI endpoints.
    """
    return Settings()


# Validate required settings on startup
def validate_settings(settings: Settings) -> None:
    """Validate that required settings are configured."""
    required_vars = [
        ("SECRET_KEY", settings.SECRET_KEY, "your-secret-key-change-in-production"),
    ]
    
    for var_name, var_value, default_value in required_vars:
        if var_value == default_value:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(
                f"⚠️  {var_name} is using default value. "
                f"Please set {var_name} environment variable in production."
            )


# Instantiate settings
settings = get_settings()