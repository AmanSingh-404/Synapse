import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.db import SessionLocal
from app.models import User, RefreshToken


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def cleanup_user():
    """Deletes any user matching the given email (and their tokens) after the test."""
    emails_to_clean = []

    def _register(email):
        emails_to_clean.append(email)
        return email

    yield _register

    db = SessionLocal()
    for email in emails_to_clean:
        user = db.query(User).filter(User.email == email).first()
        if user:
            db.query(RefreshToken).filter(RefreshToken.user_id == user.id).delete()
            db.delete(user)
    db.commit()
    db.close()