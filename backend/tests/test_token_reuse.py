def test_reused_refresh_token_revokes_family(client, cleanup_user):
    email = "reuse_test@example.com"
    cleanup_user(email)

    client.post("/auth/register", json={"email": email, "password": "testpass123"})
    r = client.post("/auth/login", json={"email": email, "password": "testpass123"})
    original_refresh = r.json()["refresh_token"]

    # First refresh — should succeed
    r1 = client.post("/auth/refresh", json={"refresh_token": original_refresh})
    assert r1.status_code == 200
    rotated_refresh = r1.json()["refresh_token"]

    # Replay the original token — should fail, reuse detected
    r2 = client.post("/auth/refresh", json={"refresh_token": original_refresh})
    assert r2.status_code == 401
    assert "reuse" in r2.json()["detail"].lower()

    # The rotated token should ALSO now be dead (whole family revoked)
    r3 = client.post("/auth/refresh", json={"refresh_token": rotated_refresh})
    assert r3.status_code == 401