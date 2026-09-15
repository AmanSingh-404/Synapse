import uuid
import hashlib
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from jose import jwt, JWTError
from slowapi import Limiter
from slowapi.util import get_remote_address
import httpx
from fastapi.responses import RedirectResponse
from cryptography.fernet import Fernet

from app.db import get_db
from app.models import User, RefreshToken
from app.schemas import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from app.security import hash_password, verify_password
from app.tokens import create_access_token, create_refresh_token, verify_access_token, PUBLIC_KEY, ALGORITHM
from app.config import settings

from app.tokens import create_oauth_state_token, verify_oauth_state_token

FRONTEND_URL = settings.frontend_url


router = APIRouter(prefix="/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)
auth_logger = logging.getLogger("synapse.auth")

MAX_FAILED_ATTEMPTS = 5
REFRESH_TOKEN_EXPIRE_SECONDS = 14 * 24 * 60 * 60  # 14 days, matches tokens.py

GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_CALLBACK_REDIRECT = f"{settings.backend_url}/auth/github/callback"


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def set_refresh_cookie(response: Response, token: str):
    response.set_cookie(
        key="refresh_token",
        value=token,
        httponly=True,
        secure=settings.environment == "production",
        samesite="lax",
        max_age=REFRESH_TOKEN_EXPIRE_SECONDS,
        path="/auth",
    )


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
def login(request: Request, response: Response, payload: LoginRequest, db: Session = Depends(get_db)):
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

    set_refresh_cookie(response, refresh_token)

    auth_logger.info(f"login success user_id={user.id}")
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("5/minute")
def refresh(request: Request, response: Response, db: Session = Depends(get_db)):
    incoming_token = request.cookies.get("refresh_token")
    if not incoming_token:
        auth_logger.warning("refresh failed - no cookie provided")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No refresh token provided")

    try:
        decoded = jwt.decode(incoming_token, PUBLIC_KEY, algorithms=[ALGORITHM])
    except JWTError:
        auth_logger.warning("refresh failed - invalid/malformed token")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    if decoded.get("type") != "refresh":
        auth_logger.warning("refresh failed - wrong token type")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

    token_hash = hash_token(incoming_token)
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

    set_refresh_cookie(response, new_refresh)

    auth_logger.info(f"refresh success user_id={stored.user_id} family_id={family_id}")
    return TokenResponse(access_token=new_access, refresh_token=new_refresh)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("5/minute")
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    incoming_token = request.cookies.get("refresh_token")
    if incoming_token:
        token_hash = hash_token(incoming_token)
        stored = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
        if stored and stored.revoked_at is None:
            stored.revoked_at = datetime.now(timezone.utc)
            db.commit()
            auth_logger.info(f"logout success user_id={stored.user_id}")

    response.delete_cookie(key="refresh_token", path="/auth")
    return None


@router.get("/me")
def me(user_id: str = Depends(verify_access_token)):
    return {"user_id": user_id}




@router.get("/github/login")
def github_login(user_id: str = Depends(verify_access_token)):
    state = create_oauth_state_token(user_id)
    params = (
        f"client_id={settings.github_client_id}"
        f"&redirect_uri={GITHUB_CALLBACK_REDIRECT}"
        f"&scope=repo"
        f"&state={state}"
    )
    return {"authorize_url": f"{GITHUB_AUTHORIZE_URL}?{params}"}


@router.get("/github/callback")
def github_callback(code: str, state: str, db: Session = Depends(get_db)):
    try:
        user_id = verify_oauth_state_token(state)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired OAuth state")

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
        return RedirectResponse(url=f"{FRONTEND_URL}/dashboard?github=failed")

    fernet = Fernet(settings.fernet_key.encode())
    encrypted_token = fernet.encrypt(github_token.encode()).decode()

    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.encrypted_github_token = encrypted_token
        db.commit()
        auth_logger.info(f"github oauth success user_id={user.id}")

    return RedirectResponse(url=f"{FRONTEND_URL}/onboarding?github=connected")