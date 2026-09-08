from jose import jwt

from app.tokens import create_access_token, create_refresh_token, PUBLIC_KEY, ALGORITHM


def test_access_token_has_correct_claims():
    token = create_access_token(user_id="abc-123")
    payload = jwt.decode(token, PUBLIC_KEY, algorithms=[ALGORITHM])
    assert payload["sub"] == "abc-123"
    assert payload["type"] == "access"
    assert "exp" in payload


def test_refresh_token_has_correct_claims():
    token, expires_at = create_refresh_token(user_id="abc-123", family_id="fam-456")
    payload = jwt.decode(token, PUBLIC_KEY, algorithms=[ALGORITHM])
    assert payload["sub"] == "abc-123"
    assert payload["type"] == "refresh"
    assert payload["family_id"] == "fam-456"
    assert "jti" in payload