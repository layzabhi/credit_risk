"""
Logging configuration and utilities.
Sets up structured logging, file handlers, and monitoring integration.
"""

import logging
import logging.handlers
import json
import sys
import os
from typing import Optional
from datetime import datetime
import uuid

from app.config import get_settings


# Request context for correlation IDs
_request_id: Optional[str] = None


def set_request_id(request_id: str) -> None:
    """Set the current request ID for correlation."""
    global _request_id
    _request_id = request_id


def get_request_id() -> str:
    """Get the current request ID."""
    global _request_id
    if _request_id is None:
        _request_id = str(uuid.uuid4())
    return _request_id


class StructuredFormatter(logging.Formatter):
    """Custom formatter for structured JSON logging."""

    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON."""
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": get_request_id(),
        }

        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        if hasattr(record, "user_id"):
            log_data["user_id"] = record.user_id

        if hasattr(record, "path"):
            log_data["path"] = record.path

        if hasattr(record, "method"):
            log_data["method"] = record.method

        if hasattr(record, "status_code"):
            log_data["status_code"] = record.status_code

        if hasattr(record, "duration"):
            log_data["duration_ms"] = record.duration

        return json.dumps(log_data)


class SimpleFormatter(logging.Formatter):
    """Simple text formatter for console logging."""

    COLORS = {
        "DEBUG": "\033[36m",      # Cyan
        "INFO": "\033[32m",       # Green
        "WARNING": "\033[33m",    # Yellow
        "ERROR": "\033[31m",      # Red
        "CRITICAL": "\033[35m",   # Magenta
        "RESET": "\033[0m",       # Reset
    }

    def format(self, record: logging.LogRecord) -> str:
        """Format log record with colors."""
        if record.levelname in self.COLORS:
            color = self.COLORS[record.levelname]
            reset = self.COLORS["RESET"]
            record.levelname = f"{color}{record.levelname}{reset}"

        timestamp = datetime.fromtimestamp(record.created).isoformat()
        base_format = f"[{timestamp}] [{record.levelname}] {record.name}: {record.getMessage()}"

        if record.exc_info:
            base_format += "\n" + self.formatException(record.exc_info)

        return base_format


def configure_logging() -> logging.Logger:
    """
    Configure application logging.

    Sets up:
    - Console handler with colored output
    - File handler with rotation
    - JSON structured logging
    - Sentry integration (if enabled)
    - Appropriate log levels per module

    Returns:
        Configured logger instance
    """
    settings = get_settings()
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG)

    # Remove any existing handlers
    root_logger.handlers.clear()

    # Console handler (always added)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, settings.LOG_LEVEL, logging.INFO))
    console_formatter = SimpleFormatter()
    console_handler.setFormatter(console_formatter)
    root_logger.addHandler(console_handler)

    # File handler (if log file specified)
    if settings.LOG_FILE:
        os.makedirs(os.path.dirname(settings.LOG_FILE) or ".", exist_ok=True)

        file_handler = logging.handlers.RotatingFileHandler(
            settings.LOG_FILE,
            maxBytes=10 * 1024 * 1024,  # 10 MB
            backupCount=10,
        )
        file_handler.setLevel(logging.DEBUG)
        file_formatter = StructuredFormatter()
        file_handler.setFormatter(file_formatter)
        root_logger.addHandler(file_handler)

    # Set log levels for specific modules
    module_log_levels = {
        "sqlalchemy.engine": logging.INFO if settings.DEBUG else logging.WARNING,
        "sqlalchemy.pool": logging.INFO if settings.DEBUG else logging.WARNING,
        "urllib3": logging.WARNING,
        "aiohttp": logging.INFO if settings.DEBUG else logging.WARNING,
        "asyncio": logging.INFO if settings.DEBUG else logging.WARNING,
    }

    for module_name, level in module_log_levels.items():
        logging.getLogger(module_name).setLevel(level)

    # Sentry integration (if configured)
    if settings.SENTRY_DSN:
        try:
            import sentry_sdk
            from sentry_sdk.integrations.fastapi import FastApiIntegration
            from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
            from sentry_sdk.integrations.logging import LoggingIntegration

            sentry_logging = LoggingIntegration(
                level=logging.INFO,
                event_level=logging.ERROR,
            )

            sentry_sdk.init(
                dsn=settings.SENTRY_DSN,
                integrations=[
                    FastApiIntegration(),
                    SqlalchemyIntegration(),
                    sentry_logging,
                ],
                traces_sample_rate=0.1,
                environment="production" if not settings.DEBUG else "development",
            )
            root_logger.info("Sentry monitoring initialized")
        except Exception as e:
            root_logger.warning(f"Failed to initialize Sentry: {e}")

    logger = logging.getLogger("app")
    logger.info(f"Logging configured - Level: {settings.LOG_LEVEL}, File: {settings.LOG_FILE}")

    return logger


def get_logger(name: str) -> logging.Logger:
    """
    Get a named logger instance.

    Args:
        name: Logger name (typically __name__)

    Returns:
        Configured logger instance
    """
    return logging.getLogger(name)


class LogContext:
    """Context manager for adding request-specific logging context."""

    def __init__(
        self,
        user_id: Optional[str] = None,
        path: Optional[str] = None,
        method: Optional[str] = None,
        request_id: Optional[str] = None,
    ):
        """Initialize context."""
        self.user_id = user_id
        self.path = path
        self.method = method
        self.request_id = request_id or str(uuid.uuid4())

    def __enter__(self):
        """Enter context."""
        set_request_id(self.request_id)

        # Add context to logging record
        logger = logging.getLogger()
        if self.user_id:
            for handler in logger.handlers:
                handler.addFilter(self._filter)

        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Exit context."""
        logger = logging.getLogger()
        for handler in logger.handlers:
            if hasattr(handler, 'removeFilter'):
                try:
                    handler.removeFilter(self._filter)
                except ValueError:
                    pass

    def _filter(self, record: logging.LogRecord) -> bool:
        """Add context to log record."""
        if self.user_id:
            record.user_id = self.user_id
        if self.path:
            record.path = self.path
        if self.method:
            record.method = self.method
        return True


def log_request_response(
    method: str,
    path: str,
    status_code: int,
    duration_ms: float,
    user_id: Optional[str] = None,
) -> None:
    """
    Log HTTP request/response.

    Args:
        method: HTTP method
        path: Request path
        status_code: Response status code
        duration_ms: Request duration in milliseconds
        user_id: Optional user ID
    """
    logger = get_logger(__name__)

    log_level = logging.WARNING if status_code >= 400 else logging.INFO
    message = (
        f"{method} {path} - {status_code} - {duration_ms:.2f}ms"
    )

    if user_id:
        message += f" - User: {user_id}"

    logger.log(log_level, message)


def log_model_prediction(
    model_name: str,
    model_version: str,
    prediction_time_ms: float,
    confidence: float,
    status: str = "success",
) -> None:
    """
    Log model prediction.

    Args:
        model_name: Model name
        model_version: Model version
        prediction_time_ms: Prediction time in milliseconds
        confidence: Prediction confidence score
        status: Prediction status
    """
    logger = get_logger(__name__)
    message = (
        f"Model prediction - Model: {model_name}, Version: {model_version}, "
        f"Time: {prediction_time_ms:.2f}ms, Confidence: {confidence:.4f}, "
        f"Status: {status}"
    )
    logger.info(message)


def log_database_operation(
    operation: str,
    table: str,
    duration_ms: float,
    rows_affected: int = 0,
) -> None:
    """
    Log database operation.

    Args:
        operation: Operation type (SELECT, INSERT, UPDATE, DELETE)
        table: Table name
        duration_ms: Operation duration in milliseconds
        rows_affected: Number of rows affected
    """
    logger = get_logger("app.database")
    message = (
        f"{operation} on {table} - "
        f"Duration: {duration_ms:.2f}ms"
    )

    if rows_affected > 0:
        message += f" - Rows affected: {rows_affected}"

    logger.debug(message)


def log_error(
    error_code: str,
    message: str,
    details: Optional[dict] = None,
    exc_info: bool = True,
) -> None:
    """
    Log error with structured format.

    Args:
        error_code: Machine-readable error code
        message: Human-readable error message
        details: Additional error details
        exc_info: Include exception info in log
    """
    logger = get_logger(__name__)
    full_message = f"[{error_code}] {message}"

    if details:
        full_message += f" - Details: {json.dumps(details)}"

    logger.error(full_message, exc_info=exc_info)


def log_security_event(
    event_type: str,
    user_id: Optional[str] = None,
    details: Optional[dict] = None,
) -> None:
    """
    Log security-related events.

    Args:
        event_type: Type of security event
        user_id: Affected user ID
        details: Additional event details
    """
    logger = get_logger("app.security")
    message = f"Security event: {event_type}"

    if user_id:
        message += f" - User: {user_id}"

    if details:
        message += f" - {json.dumps(details)}"

    logger.warning(message)
