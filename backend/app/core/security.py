"""
Security utilities and authentication helpers.
Manages JWT tokens, password hashing, authorization, and CORS.
"""

import logging
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

from app.config import get_settings
from app.core.logging import log_security_event

settings = get_settings()
logger = logging.getLogger(__name__)

# Password hashing context
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12,
)

# OAuth2 scheme for FastAPI
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
    scopes={
        "read": "Read access",
        "write": "Write access",
        "admin": "Admin access",
    },
)


class TokenData(BaseModel):
    """JWT token payload."""

    user_id: str
    username: str
    email: str
    role: str
    scopes: List[str] = []
    exp: Optional[datetime] = None
    iat: Optional[datetime] = None
    jti: Optional[str] = None  # JWT ID for token revocation


class RefreshTokenData(BaseModel):
    """Refresh token payload."""

    user_id: str
    jti: str
    exp: Optional[datetime] = None


class UserCredentials(BaseModel):
    """User login credentials."""

    username: str
    password: str


class TokenResponse(BaseModel):
    """JWT token response."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # Seconds


def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt.

    Args:
        password: Plain text password

    Returns:
        Hashed password
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain text password against a hash.

    Args:
        plain_password: Plain text password
        hashed_password: Hashed password

    Returns:
        True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(
    user_id: str,
    username: str,
    email: str,
    role: str,
    scopes: Optional[List[str]] = None,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Create a JWT access token.

    Args:
        user_id: User ID
        username: Username
        email: User email
        role: User role (admin, scorer, viewer)
        scopes: User scopes/permissions
        expires_delta: Token expiration time

    Returns:
        JWT access token
    """
    if expires_delta is None:
        expires_delta = timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    now = datetime.utcnow()
    expire = now + expires_delta

    payload: Dict[str, Any] = {
        "user_id": user_id,
        "username": username,
        "email": email,
        "role": role,
        "scopes": scopes or [],
        "exp": expire,
        "iat": now,
        "jti": str(uuid.uuid4()),  # JWT ID for revocation
        "type": "access",
    }

    encoded_jwt = jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )

    logger.debug(f"Access token created for user: {username}")
    return encoded_jwt


def create_refresh_token(
    user_id: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Create a JWT refresh token.

    Args:
        user_id: User ID
        expires_delta: Token expiration time (default: 7 days)

    Returns:
        JWT refresh token
    """
    if expires_delta is None:
        expires_delta = timedelta(days=7)

    now = datetime.utcnow()
    expire = now + expires_delta

    payload: Dict[str, Any] = {
        "user_id": user_id,
        "exp": expire,
        "iat": now,
        "jti": str(uuid.uuid4()),
        "type": "refresh",
    }

    encoded_jwt = jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )

    logger.debug(f"Refresh token created for user_id: {user_id}")
    return encoded_jwt


def decode_token(token: str) -> Optional[TokenData]:
    """
    Decode and validate a JWT access token.

    Args:
        token: JWT token string

    Returns:
        TokenData if valid, None otherwise
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )

        # Check token type
        if payload.get("type") != "access":
            logger.warning("Token type mismatch")
            return None

        user_id = payload.get("user_id")
        username = payload.get("username")
        email = payload.get("email")
        role = payload.get("role")
        scopes = payload.get("scopes", [])

        if not all([user_id, username, email, role]):
            logger.warning("Token missing required fields")
            return None

        return TokenData(
            user_id=user_id,
            username=username,
            email=email,
            role=role,
            scopes=scopes,
            exp=payload.get("exp"),
            iat=payload.get("iat"),
            jti=payload.get("jti"),
        )

    except JWTError as e:
        logger.warning(f"JWT decode error: {e}")
        return None


def decode_refresh_token(token: str) -> Optional[RefreshTokenData]:
    """
    Decode and validate a JWT refresh token.

    Args:
        token: JWT refresh token string

    Returns:
        RefreshTokenData if valid, None otherwise
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )

        # Check token type
        if payload.get("type") != "refresh":
            logger.warning("Refresh token type mismatch")
            return None

        user_id = payload.get("user_id")
        jti = payload.get("jti")

        if not all([user_id, jti]):
            logger.warning("Refresh token missing required fields")
            return None

        return RefreshTokenData(
            user_id=user_id,
            jti=jti,
            exp=payload.get("exp"),
        )

    except JWTError as e:
        logger.warning(f"Refresh token decode error: {e}")
        return None


async def get_current_user(token: str = Depends(oauth2_scheme)) -> TokenData:
    """
    FastAPI dependency to get current authenticated user.

    Args:
        token: JWT token from Authorization header

    Returns:
        TokenData of authenticated user

    Raises:
        HTTPException: If token is invalid or expired
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token_data = decode_token(token)

    if token_data is None:
        log_security_event(
            "invalid_token",
            details={"reason": "Token decode failed"},
        )
        raise credentials_exception

    return token_data


async def get_current_active_user(
    current_user: TokenData = Depends(get_current_user),
) -> TokenData:
    """
    FastAPI dependency to get current active user.

    Args:
        current_user: Current authenticated user

    Returns:
        TokenData if user is active

    Raises:
        HTTPException: If user is inactive
    """
    # Additional checks can be added here (e.g., check if user is still active in DB)
    return current_user


def check_permission(
    user: TokenData,
    required_permission: str,
) -> bool:
    """
    Check if user has required permission.

    Args:
        user: TokenData of user
        required_permission: Required permission scope

    Returns:
        True if user has permission, False otherwise
    """
    # Admin role has all permissions
    if user.role == "admin":
        return True

    # Check scopes
    return required_permission in user.scopes


def check_role(
    user: TokenData,
    required_role: str,
) -> bool:
    """
    Check if user has required role.

    Args:
        user: TokenData of user
        required_role: Required role

    Returns:
        True if user has role or is admin, False otherwise
    """
    if user.role == "admin":
        return True

    return user.role == required_role


def require_permission(required_permission: str):
    """
    FastAPI dependency for permission checking.

    Args:
        required_permission: Required permission scope

    Returns:
        Dependency function that checks permission

    Raises:
        HTTPException: If user lacks required permission
    """
    async def check_permission_dep(
        current_user: TokenData = Depends(get_current_active_user),
    ) -> TokenData:
        if not check_permission(current_user, required_permission):
            log_security_event(
                "permission_denied",
                user_id=current_user.user_id,
                details={"required_permission": required_permission},
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission required: {required_permission}",
            )
        return current_user

    return check_permission_dep


def require_role(required_role: str):
    """
    FastAPI dependency for role checking.

    Args:
        required_role: Required role

    Returns:
        Dependency function that checks role

    Raises:
        HTTPException: If user lacks required role
    """
    async def check_role_dep(
        current_user: TokenData = Depends(get_current_active_user),
    ) -> TokenData:
        if not check_role(current_user, required_role):
            log_security_event(
                "role_denied",
                user_id=current_user.user_id,
                details={"required_role": required_role},
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role required: {required_role}",
            )
        return current_user

    return check_role_dep


def generate_correlation_id() -> str:
    """
    Generate a unique correlation ID for request tracing.

    Returns:
        UUID string for correlation ID
    """
    return str(uuid.uuid4())


def sanitize_error_response(error: Exception) -> Dict[str, Any]:
    """
    Sanitize error response to avoid exposing sensitive information.

    Args:
        error: Exception to sanitize

    Returns:
        Safe error response dictionary
    """
    error_type = type(error).__name__

    # Don't expose internal details in production
    if settings.DEBUG:
        return {
            "error_type": error_type,
            "message": str(error),
        }
    else:
        return {
            "error_type": "InternalError",
            "message": "An error occurred processing your request",
        }


# Rate limiting helper
class RateLimitTracker:
    """Track rate limiting per user/endpoint."""

    def __init__(self):
        """Initialize tracker."""
        self.requests: Dict[str, List[datetime]] = {}

    def check_rate_limit(
        self,
        identifier: str,
        limit: int = 100,
        window_minutes: int = 1,
    ) -> bool:
        """
        Check if identifier has exceeded rate limit.

        Args:
            identifier: User ID or IP address
            limit: Request limit
            window_minutes: Time window in minutes

        Returns:
            True if within limit, False if exceeded
        """
        now = datetime.utcnow()
        window_start = now - timedelta(minutes=window_minutes)

        # Initialize if not exists
        if identifier not in self.requests:
            self.requests[identifier] = []

        # Remove old requests outside window
        self.requests[identifier] = [
            req_time
            for req_time in self.requests[identifier]
            if req_time > window_start
        ]

        # Check limit
        if len(self.requests[identifier]) >= limit:
            log_security_event(
                "rate_limit_exceeded",
                details={"identifier": identifier, "limit": limit},
            )
            return False

        # Record new request
        self.requests[identifier].append(now)
        return True


# Global rate limiter instance
rate_limiter = RateLimitTracker()
