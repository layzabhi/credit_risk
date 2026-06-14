"""
FastAPI main application entry point for Credit Risk Assessment System.
Implements request/response handling, middleware, error handling, and API route aggregation.
"""

import logging
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
import uvicorn

from app.config import settings
from app.core.exceptions import ApplicationException
from app.core.logging import configure_logging
from app.database.session import engine, Base, get_db
from app.api.v1.router import api_router
from app.services.model_loader import ModelLoader

# Configure logging
logger = configure_logging()

# Global state for model loading
model_loader: Optional[ModelLoader] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage application lifespan: startup and shutdown.
    Loads models on startup, cleans up on shutdown.
    """
    global model_loader
    
    # Startup
    logger.info("Credit Risk Assessment API starting up...")
    
    # Create database tables if not exist
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized")
    
    # Load ML models into memory
    try:
        model_loader = ModelLoader(model_dir=settings.MODELS_DIR)
        await model_loader.load_models()
        logger.info(f"Loaded {len(model_loader.models)} models successfully")
    except Exception as e:
        logger.error(f"Failed to load models: {e}", exc_info=True)
        # Don't fail startup, but log critical error
        model_loader = None
    
    yield
    
    # Shutdown
    logger.info("Credit Risk Assessment API shutting down...")
    if model_loader:
        await model_loader.cleanup()
        logger.info("Models unloaded")


# Create FastAPI app
app = FastAPI(
    title="Credit Risk Assessment API",
    description="AI-powered credit risk scoring and portfolio management system",
    version="2.0.0",
    lifespan=lifespan,
)

# Security: Trust only specified hosts
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS.split(",") if settings.ALLOWED_HOSTS else ["*"],
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(",") if settings.CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Custom middleware for request/response logging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log incoming requests and outgoing responses."""
    import time
    start_time = time.time()
    
    try:
        response = await call_next(request)
    except Exception as exc:
        logger.error(f"Request failed: {exc}", exc_info=True)
        raise
    
    duration = time.time() - start_time
    logger.info(
        f"{request.method} {request.url.path} - "
        f"Status: {response.status_code} - Duration: {duration:.3f}s"
    )
    return response


# Exception handlers
@app.exception_handler(ApplicationException)
async def application_exception_handler(request: Request, exc: ApplicationException):
    """Handle custom application exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.error_code,
            "message": exc.message,
            "details": exc.details,
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle Pydantic validation errors."""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "VALIDATION_ERROR",
            "message": "Request validation failed",
            "details": exc.errors(),
        },
    )


@app.exception_handler(SQLAlchemyError)
async def database_exception_handler(request: Request, exc: SQLAlchemyError):
    """Handle database errors."""
    logger.error(f"Database error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "DATABASE_ERROR",
            "message": "An error occurred while accessing the database",
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "INTERNAL_SERVER_ERROR",
            "message": "An unexpected error occurred",
        },
    )


# Health check endpoint
@app.get("/health", tags=["System"])
async def health_check():
    """
    System health check endpoint.
    Returns: status, model readiness, database connection status.
    """
    health_status = {
        "status": "healthy",
        "models_loaded": model_loader is not None and len(model_loader.models) > 0,
        "api_version": "2.0.0",
    }
    
    # Check database connectivity
    try:
        db = next(get_db())
        # Simple query to verify connection
        db.execute("SELECT 1")
        health_status["database"] = "connected"
    except Exception as e:
        logger.warning(f"Database health check failed: {e}")
        health_status["database"] = "disconnected"
        health_status["status"] = "degraded"
    
    return health_status


# Include API routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/", tags=["System"])
async def root():
    """Root endpoint with API documentation link."""
    return {
        "name": "Credit Risk Assessment API",
        "version": "2.0.0",
        "documentation": "/docs",
        "status": "running",
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info",
    )