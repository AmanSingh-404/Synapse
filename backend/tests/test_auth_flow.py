def test_full_auth_flow(client, cleanup_user):
    email = "integration_test@example.com"
    cleanup_user(email)

    # Register
    r = client.post("/auth/register", json={"email": email, "password": "testpass123"})
    assert r.status_code == 201

    # Login
    r = client.post("/auth/login", json={"email": email, "password": "testpass123"})
    assert r.status_code == 200
    tokens = r.json()
    assert "access_token" in tokens
    assert "refresh_token" in tokens

    # Refresh
    r = client.post("/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert r.status_code == 200
    new_tokens = r.json()
    assert new_tokens["refresh_token"] != tokens["refresh_token"]

    # Logout
    r = client.post("/auth/logout", json={"refresh_token": new_tokens["refresh_token"]})
    assert r.status_code == 204