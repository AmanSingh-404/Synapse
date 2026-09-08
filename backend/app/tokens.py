import uuid
from datetime import datetime, timedelta, timezone

from jose import jwt

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError

bearer_scheme = HTTPBearer()


with open("keys/private.pem", "r") as f:
    PRIVATE_KEY = f.read()

with open("keys/public.pem", "r") as f:
    PUBLIC_KEY = f.read()

ALGORITHM = "RS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 14


def create_access_token(user_id: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "type": "access",
        "iat": now,
        "exp": now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, PRIVATE_KEY, algorithm=ALGORITHM)


def create_refresh_token(user_id: str, family_id: str) -> tuple[str, datetime]:
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": str(user_id),
        "type": "refresh",
        "family_id": str(family_id),
        "jti": str(uuid.uuid4()),
        "iat": now,
        "exp": expires_at,
    }
    token = jwt.encode(payload, PRIVATE_KEY, algorithm=ALGORITHM)
    return token, expires_at

def verify_access_token(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> str:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, PUBLIC_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
        return payload["sub"]
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")