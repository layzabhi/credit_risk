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


