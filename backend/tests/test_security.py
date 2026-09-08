from app.security import hash_password, verify_password


def test_correct_password_passes():
    hashed = hash_password("correct-horse-battery-staple")
    assert verify_password(hashed, "correct-horse-battery-staple") is True


def test_wrong_password_fails():
    hashed = hash_password("correct-horse-battery-staple")
    assert verify_password(hashed, "wrong-password") is False