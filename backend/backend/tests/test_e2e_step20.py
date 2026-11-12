"""
Test the original E2E Step 20 (Manual Stock Adjustment) from test_pos_e2e.py
"""
import requests
import sys

BASE = "http://localhost:8000"
USERNAME = "lakshman"
PASSWORD = "Kbprakash@78935"

def test_e2e_step20():
    headers = {}
    company_id = None
    product_id = None

    # Login
    resp = requests.post(f"{BASE}/auth/login", data={
        "username": USERNAME,
        "password": PASSWORD
    })
    if resp.status_code != 200:
        print(f"FAILED Login: {resp.text}")
        return False
    token = resp.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    print("✓ Login successful")

    # Get user info
    resp = requests.get(f"{BASE}/auth/me", headers=headers)
    if resp.status_code != 200:
        print(f"FAILED Get user: {resp.text}")
        return False
    company_id = resp.json().get("company_id")
    print(f"✓ Company ID: {company_id}")

    # Get a product
    resp = requests.get(f"{BASE}/pos/products?active_only=false", headers=headers)
    if resp.status_code != 200:
        print(f"FAILED Get products: {resp.text}")
        return False
    products = resp.json()
    if not products:
        print("No products found")
        return False
    product_id = products[0]["id"]
    print(f"✓ Product: {products[0]['name']} (stock: {products[0]['stock_quantity']})")

    # ===== Step 20: Manual Stock Adjustment (from original E2E test) =====
    print("=" * 60)
    print("STEP 20: Manual Stock Adjustment (Original E2E Test)")
    print("=" * 60)
    resp = requests.post(f"{BASE}/pos/inventory/adjust", headers=headers, json={
        "company_id": company_id,
        "product_id": product_id,
        "quantity": 10,
        "movement_type": "in",
        "notes": "Restocking wireless mice"
    })
    print(f"Status: {resp.status_code}")
    if resp.status_code in (200, 201):
        result = resp.json()
        print(f"New stock: {result.get('stock_quantity')}")
        print("✓ Stock adjustment done")
    else:
        print(f"FAILED: {resp.text}")
        return False

    print()
    print("E2E Step 20 - PASSED ✓")
    return True

if __name__ == "__main__":
    success = test_e2e_step20()
    sys.exit(0 if success else 1)
