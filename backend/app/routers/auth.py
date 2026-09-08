import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.db import get_db
from app.models import User
from app.schemas import RegisterRequest, UserResponse
from app.security import hash_password

from app.schemas import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from app.security import hash_password, verify_password
from app.tokens import create_access_token, create_refresh_token
from app.models import User, RefreshToken
from datetime import datetime, timezone
import hashlib

MAX_FAILED_ATTEMPTS = 5

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
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
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    db.refresh(user)
    return UserResponse(id=str(user.id), email=user.email)



def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if user.is_locked:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account locked due to too many failed attempts")

    if not verify_password(user.hashed_password, payload.password):
        user.failed_attempts += 1
        if user.failed_attempts >= MAX_FAILED_ATTEMPTS:
            user.is_locked = True
        db.commit()
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

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)