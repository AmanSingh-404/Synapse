import uuid
import hashlib
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from jose import jwt, JWTError
from slowapi import Limiter
from slowapi.util import get_remote_address

import httpx
from fastapi.responses import RedirectResponse
from cryptography.fernet import Fernet

from app.config import settings

from app.db import get_db
from app.models import User, RefreshToken
from app.schemas import RegisterRequest, LoginRequest, RefreshRequest, TokenResponse, UserResponse
from app.security import hash_password, verify_password
from app.tokens import create_access_token, create_refresh_token, PUBLIC_KEY, ALGORITHM

from app.tokens import create_access_token, create_refresh_token, verify_access_token, PUBLIC_KEY, ALGORITHM

router = APIRouter(prefix="/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)
auth_logger = logging.getLogger("synapse.auth")

MAX_FAILED_ATTEMPTS = 5


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def register(request: Request, payload: RegisterRequest, db: Session = Depends(get_db)):
    user = User(
        id=uuid.uuid4(),
        email=payload.email,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        auth_logger.warning(f"register failed - email already exists email={payload.email}")
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    db.refresh(user)
    auth_logger.info(f"register success user_id={user.id}")
    return UserResponse(id=str(user.id), email=user.email)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()

    if not user:
        auth_logger.warning(f"login failed - no such user email={payload.email}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if user.is_locked:
        auth_logger.warning(f"login blocked - account locked user_id={user.id}")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account locked due to too many failed attempts")

    if not verify_password(user.hashed_password, payload.password):
        user.failed_attempts += 1
        if user.failed_attempts >= MAX_FAILED_ATTEMPTS:
            user.is_locked = True
            auth_logger.warning(f"account locked - too many failed attempts user_id={user.id}")
        db.commit()
        auth_logger.warning(f"login failed - bad password user_id={user.id}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    user.failed_attempts = 0
    db.commit()

    access_token = create_access_token(user_id=str(user.id))
    family_id = uuid.uuid4()
    refresh_token, expires_at = create_refresh_token(user_id=str(user.id), family_id=str(family_id))

    db.add(RefreshToken(
        id=uuid.uuid4(),
        user_id=user.id,
        token_hash=hash_token(refresh_token),
        family_id=family_id,
        expires_at=expires_at,
    ))
    db.commit()

    auth_logger.info(f"login success user_id={user.id}")
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("5/minute")
def refresh(request: Request, payload: RefreshRequest, db: Session = Depends(get_db)):
    try:
        decoded = jwt.decode(payload.refresh_token, PUBLIC_KEY, algorithms=[ALGORITHM])
    except JWTError:
        auth_logger.warning("refresh failed - invalid/malformed token")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    if decoded.get("type") != "refresh":
        auth_logger.warning("refresh failed - wrong token type")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

    token_hash = hash_token(payload.refresh_token)
    stored = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()

    if not stored:
        auth_logger.warning("refresh failed - token not recognized")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token not recognized")

    if stored.revoked_at is not None:
        db.query(RefreshToken).filter(
            RefreshToken.family_id == stored.family_id,
            RefreshToken.revoked_at.is_(None),
        ).update({"revoked_at": datetime.now(timezone.utc)})
        db.commit()
        auth_logger.warning(f"REUSE DETECTED - family revoked family_id={stored.family_id} user_id={stored.user_id}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token reuse detected — session revoked")

    if stored.expires_at < datetime.now(timezone.utc):
        auth_logger.warning(f"refresh failed - expired user_id={stored.user_id}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired")

    stored.revoked_at = datetime.now(timezone.utc)

    user_id = decoded["sub"]
    family_id = stored.family_id

    new_access = create_access_token(user_id=user_id)
    new_refresh, new_expires_at = create_refresh_token(user_id=user_id, family_id=str(family_id))

    db.add(RefreshToken(
        id=uuid.uuid4(),
        user_id=stored.user_id,
        token_hash=hash_token(new_refresh),
        family_id=family_id,
        expires_at=new_expires_at,
    ))
    db.commit()

    auth_logger.info(f"refresh success user_id={stored.user_id} family_id={family_id}")
    return TokenResponse(access_token=new_access, refresh_token=new_refresh)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("5/minute")
def logout(request: Request, payload: RefreshRequest, db: Session = Depends(get_db)):
    token_hash = hash_token(payload.refresh_token)
    stored = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()

    if stored and stored.revoked_at is None:
        stored.revoked_at = datetime.now(timezone.utc)
        db.commit()
        auth_logger.info(f"logout success user_id={stored.user_id}")

    return None

GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_CALLBACK_REDIRECT = "http://127.0.0.1:8001/auth/github/callback"


@router.get("/github/login")
def github_login():
    params = (
        f"client_id={settings.github_client_id}"
        f"&redirect_uri={GITHUB_CALLBACK_REDIRECT}"
        f"&scope=repo"
    )
    return RedirectResponse(url=f"{GITHUB_AUTHORIZE_URL}?{params}")


@router.get("/github/callback")
def github_callback(code: str, db: Session = Depends(get_db)):
    # Exchange the code for a GitHub access token
    with httpx.Client() as client:
        response = client.post(
            GITHUB_TOKEN_URL,
            data={
                "client_id": settings.github_client_id,
                "client_secret": settings.github_client_secret,
                "code": code,
            },
            headers={"Accept": "application/json"},
        )
    data = response.json()
    github_token = data.get("access_token")

    if not github_token:
        auth_logger.warning(f"github oauth failed - no token in response: {data}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="GitHub OAuth exchange failed")

    # Encrypt before storing
    fernet = Fernet(settings.fernet_key.encode())
    encrypted_token = fernet.encrypt(github_token.encode()).decode()

    # NOTE: this stores the token against a hardcoded test user for now —
    # once the frontend exists, this will use the currently logged-in user
    # (via a state param round-tripped through the OAuth flow, tying it to
    # their session). Flag for Phase 4 wiring.
    user = db.query(User).filter(User.email == "test@example.com").first()
    if user:
        user.encrypted_github_token = encrypted_token
        db.commit()
        auth_logger.info(f"github oauth success user_id={user.id}")

    return {"message": "GitHub connected successfully"}

@router.get("/me")
def me(user_id: str = Depends(verify_access_token)):
    return {"user_id": user_id}