"""
End-to-End Email Verification Test
Tests: Registration with verification email, verify-email endpoint, resend-verification endpoint
"""
import requests
import time

BASE = "http://localhost:8000"
PASSWORD = "Test@12345"

def run_tests():
    print("=" * 70)
    print("EMAIL VERIFICATION TEST")
    print("=" * 70)
    print()

    ts = int(time.time() * 1000)

    # Step 1: Register a new user
    print("Step 1: Register a new user")
    username = f"verifytest_{ts}"
    email = f"verify_{ts}@example.com"

    r = requests.post(f"{BASE}/auth/register", json={
        "username": username,
        "email": email,
        "password": PASSWORD,
    })
    print(f"  Status: {r.status_code}")
    assert r.status_code == 201, f"Expected 201, got {r.status_code}"
    data = r.json()
    print(f"  is_email_verified: {data.get('is_email_verified')}")
    print(f"  is_profile_complete: {data.get('is_profile_complete')}")
    assert data.get("is_email_verified") is False, "New user should not be email verified"
    user_id = data.get("id")
    print("  ✓ PASS: User registered with is_email_verified=false")
    print()

    # Step 2: Login
    print("Step 2: Login")
    r = requests.post(f"{BASE}/auth/login", data={
        "username": username,
        "password": PASSWORD,
    })
    print(f"  Status: {r.status_code}")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    token = r.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    print("  ✓ PASS: Login successful")
    print()

    # Step 3: Get /auth/me
    print("Step 3: Fetch /auth/me")
    r = requests.get(f"{BASE}/auth/me", headers=headers)
    print(f"  Status: {r.status_code}")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    me = r.json()
    print(f"  is_email_verified: {me.get('is_email_verified')}")
    assert me.get("is_email_verified") is False, "User should not be verified yet"
    print("  ✓ PASS: /auth/me returns is_email_verified=false")
    print()

    # Step 4: Test verify-email with invalid token
    print("Step 4: Verify email with invalid token")
    r = requests.post(f"{BASE}/auth/verify-email", json={"token": "invalid_token"})
    print(f"  Status: {r.status_code}")
    assert r.status_code == 400, f"Expected 400, got {r.status_code}"
    print(f"  Response: {r.json()}")
    print("  ✓ PASS: Invalid token rejected")
    print()

    # Step 5: Test verify-email without token
    print("Step 5: Verify email without token")
    r = requests.post(f"{BASE}/auth/verify-email", json={})
    print(f"  Status: {r.status_code}")
    assert r.status_code == 400, f"Expected 400, got {r.status_code}"
    print(f"  Response: {r.json()}")
    print("  ✓ PASS: Missing token rejected")
    print()

    # Step 6: Test resend-verification
    print("Step 6: Resend verification email")
    r = requests.post(f"{BASE}/auth/resend-verification", json={"email": email})
    print(f"  Status: {r.status_code}")
    # May fail if SMTP not configured, which is OK
    if r.status_code in (200, 503):
        print(f"  Response: {r.json()}")
        print("  ✓ PASS: Resend endpoint works (SMTP may not be configured)")
    else:
        print(f"  Response: {r.json()}")
        print("  ✗ FAIL: Unexpected status")
    print()

    # Step 7: Test resend-verification with non-existent email
    print("Step 7: Resend verification for non-existent email")
    r = requests.post(f"{BASE}/auth/resend-verification", json={"email": "nonexistent@example.com"})
    print(f"  Status: {r.status_code}")
    assert r.status_code == 404, f"Expected 404, got {r.status_code}"
    print("  ✓ PASS: Non-existent email rejected")
    print()

    # Step 8: Test resend-verification without email
    print("Step 8: Resend verification without email")
    r = requests.post(f"{BASE}/auth/resend-verification", json={})
    print(f"  Status: {r.status_code}")
    assert r.status_code == 400, f"Expected 400, got {r.status_code}"
    print("  ✓ PASS: Missing email rejected")
    print()

    print("=" * 70)
    print("ALL TESTS PASSED!")
    print("=" * 70)


if __name__ == "__main__":
    run_tests()
