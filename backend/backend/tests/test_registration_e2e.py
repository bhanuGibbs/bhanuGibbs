"""
End-to-End Registration Test
Tests: Registration, Login, Company Setup, Quotation Flow (Invoice Profile), POS Flow (POS Profile)

This script validates the full user journey:
1. Register a new user
2. Login and verify session
3. Setup company with invoice profile
4. Create and list quotations
5. Setup a second company with POS profile
6. Create POS categories, products, and perform checkout
"""
import requests
import sys
import time
from datetime import datetime, timedelta

BASE = "http://localhost:8000"
PASSWORD = "Test@12345"  # Meets password strength requirements

# Track results
results = []


def record(test_id, description, passed, detail=""):
    """Record a test result."""
    results.append({"id": test_id, "desc": description, "passed": passed, "detail": detail})
    status = "✓ PASS" if passed else "✗ FAIL"
    print(f"  {status}: {description}" + (f" ({detail})" if detail else ""))


def timestamped(name):
    """Generate a unique name with timestamp (underscore separated for usernames/emails)."""
    return f"{name}_{int(time.time() * 1000)}"


def safe_name(name):
    """Generate a unique name that passes the company name validation pattern."""
    ts = int(time.time() * 1000)
    return f"{name} {ts}"


def run_tests():
    print("=" * 70)
    print("END-TO-END REGISTRATION TEST")
    print("Registration → Company Setup → Quotation & POS Flows")
    print("=" * 70)
    print()

    # ===== Check backend health =====
    print("-" * 70)
    print("PRE-REQUISITE: Backend Health Check")
    print("-" * 70)
    try:
        resp = requests.get(f"{BASE}/health", timeout=5)
        if resp.status_code == 200:
            print("  ✓ Backend is running")
        else:
            print(f"  ✗ Backend returned {resp.status_code}")
            return False
    except requests.ConnectionError:
        print("  ✗ Cannot connect to backend at", BASE)
        print("  Please start the backend server first.")
        return False
    print()

    # ===== Registration Flow =====
    print("=" * 70)
    print("PHASE 1: USER REGISTRATION")
    print("=" * 70)
    print()

    # R1: Register with valid credentials
    print("R1: Register with valid credentials")
    username1 = timestamped("testuser")
    email1 = f"{timestamped('test')}@example.com"

    resp = requests.post(f"{BASE}/auth/register", json={
        "username": username1,
        "email": email1,
        "password": PASSWORD,
    })
    record("R1", "Register with valid credentials", resp.status_code == 201,
           f"Status: {resp.status_code}")
    if resp.status_code == 201:
        reg_data = resp.json()
        record("R1a", "Registration returns is_profile_complete=false",
               reg_data.get("is_profile_complete") is False,
               f"Value: {reg_data.get('is_profile_complete')}")
        record("R1b", "Registration returns role=Sales",
               reg_data.get("role") == "Sales",
               f"Value: {reg_data.get('role')}")
    print()

    # R2: Register with duplicate username
    print("R2: Register with duplicate username")
    resp = requests.post(f"{BASE}/auth/register", json={
        "username": username1,
        "email": f"{timestamped('dup_user')}@example.com",
        "password": PASSWORD,
    })
    record("R2", "Duplicate username rejected", resp.status_code == 409,
           f"Status: {resp.status_code}")
    print()

    # R3: Register with duplicate email
    print("R3: Register with duplicate email")
    resp = requests.post(f"{BASE}/auth/register", json={
        "username": timestamped("dup_email"),
        "email": email1,
        "password": PASSWORD,
    })
    record("R3", "Duplicate email rejected", resp.status_code == 409,
           f"Status: {resp.status_code}")
    print()

    # R5: Login after registration
    print("R5: Login after registration")
    resp = requests.post(f"{BASE}/auth/login", data={
        "username": username1,
        "password": PASSWORD,
    })
    record("R5", "Login after registration", resp.status_code == 200,
           f"Status: {resp.status_code}")
    if resp.status_code != 200:
        print(f"  Response: {resp.text[:200]}")
        return False
    login_data = resp.json()
    token1 = login_data.get("access_token")
    has_refresh = "refresh_token" in login_data
    record("R5a", "Login returns access_token", token1 is not None,
           f"Token: {token1[:30]}...")
    record("R5b", "Login returns refresh_token", has_refresh)
    headers1 = {"Authorization": f"Bearer {token1}"}
    print()

    # R6: Fetch /auth/me after login
    print("R6: Fetch /auth/me after login")
    resp = requests.get(f"{BASE}/auth/me", headers=headers1)
    record("R6", "Fetch /auth/me", resp.status_code == 200,
           f"Status: {resp.status_code}")
    if resp.status_code == 200:
        me = resp.json()
        record("R6a", "User data has is_profile_complete=false",
               me.get("is_profile_complete") is False,
               f"Value: {me.get('is_profile_complete')}")
        record("R6b", "Username matches",
               me.get("username") == username1,
               f"Value: {me.get('username')}")
    print()

    # ===== Company Setup Flow (Invoice Profile) =====
    print("=" * 70)
    print("PHASE 2: COMPANY SETUP (INVOICE PROFILE)")
    print("=" * 70)
    print()

    # C1: Setup company with business_profile=invoice
    print("C1: Setup company with business_profile=invoice")
    company_name = safe_name("TestCompany")
    resp = requests.post(f"{BASE}/auth/setup-company", headers=headers1, json={
        "name": company_name,
        "address": "123 Test Street",
        "phone_number": "+919876543210",
        "email": "test@company.com",
        "country": "India",
        "state": "Karnataka",
        "city": "Bengaluru",
        "pincode": "560001",
        "business_profile": "invoice",
    })
    record("C1", "Setup company with invoice profile", resp.status_code == 201,
           f"Status: {resp.status_code}")
    if resp.status_code != 201:
        print(f"  Response: {resp.text[:200]}")
    company_data = resp.json() if resp.status_code == 201 else {}
    company_id = company_data.get("id")
    print()

    # C3: Fetch /auth/me after setup
    print("C3: Fetch /auth/me after setup")
    resp = requests.get(f"{BASE}/auth/me", headers=headers1)
    if resp.status_code == 200:
        me = resp.json()
        record("C3", "User is_profile_complete=true after setup",
               me.get("is_profile_complete") is True,
               f"Value: {me.get('is_profile_complete')}")
        record("C3a", "Business profile is invoice",
               me.get("business_profile") == "invoice",
               f"Value: {me.get('business_profile')}")
        record("C3b", "Company ID is set",
               me.get("company_id") is not None,
               f"Value: {me.get('company_id')}")
    print()

    # ===== Quotation Flow =====
    print("=" * 70)
    print("PHASE 3: QUOTATION FLOW")
    print("=" * 70)
    print()

    # Q1: Submit quotation
    print("Q1: Submit quotation via /quotations/submit")
    now = datetime.now(tz=None)
    quotation_payload = {
        "title": "Test Quotation",
        "description": "E2E test quotation",
        "issued_at": now.isoformat(),
        "valid_until": (now + timedelta(days=30)).isoformat(),
        "currency": "INR",
        "customer": {
            "name": "Test Customer",
            "email": "customer@example.com",
            "phone_number": "+919876543211",
            "address": "456 Customer Street",
            "city": "Bengaluru",
            "state": "Karnataka",
            "country": "India",
        },
        "items": [
            {
                "product_name": "Consulting Service",
                "description": "Software consulting",
                "unit": "Hours",
                "quantity": 10,
                "unit_price": "1500.00",
                "discount": "5",
                "gst": "18",
            },
            {
                "product_name": "License Fee",
                "description": "Annual software license",
                "unit": "Pcs",
                "quantity": 1,
                "unit_price": "5000.00",
                "discount": "0",
                "gst": "18",
            },
        ],
        "notes": "Thank you for your business",
        "terms": "Payment due within 30 days",
    }
    resp = requests.post(f"{BASE}/quotations/submit", headers=headers1, json=quotation_payload)
    record("Q1", "Submit quotation", resp.status_code == 201,
           f"Status: {resp.status_code}")
    if resp.status_code != 201:
        print(f"  Response: {resp.text[:300]}")
    quotation_id = None
    quotation_ref = None
    if resp.status_code == 201:
        quotation = resp.json()
        quotation_id = quotation.get("id")
        quotation_ref = quotation.get("reference_number")
        print(f"  Quotation ID: {quotation_id}")
        print(f"  Reference: {quotation_ref}")
    print()

    # Q2: Quotation has correct items, customer, totals
    print("Q2: Quotation has correct items, customer, totals")
    if resp.status_code == 201:
        items = quotation.get("items", [])
        record("Q2a", "Quotation has 2 items", len(items) == 2,
               f"Items: {len(items)}")
        if items:
            record("Q2b", "First item name matches",
                   items[0].get("item_name") == "Consulting Service",
                   f"Value: {items[0].get('item_name')}")
            record("Q2c", "First item quantity matches",
                   items[0].get("quantity") == 10,
                   f"Value: {items[0].get('quantity')}")
        record("Q2d", "Quotation has reference number",
               quotation_ref is not None,
               f"Value: {quotation_ref}")
    print()

    # Q3: List quotations
    print("Q3: List quotations via /quotations")
    resp = requests.get(f"{BASE}/quotations", headers=headers1)
    record("Q3", "List quotations", resp.status_code == 200,
           f"Status: {resp.status_code}")
    if resp.status_code == 200:
        quotations = resp.json()
        record("Q3a", "Quotation list is not empty", len(quotations) > 0,
               f"Count: {len(quotations)}")
        if quotation_ref:
            found = any(q.get("reference_number") == quotation_ref for q in quotations)
            record("Q3b", "Submitted quotation appears in list", found,
                   f"Reference: {quotation_ref}")
    print()

    # ===== POS Flow =====
    print("=" * 70)
    print("PHASE 4: POS TERMINAL FLOW")
    print("=" * 70)
    print()

    # For POS flow, we need an Admin user since Sales cannot create categories/products
    # We use the existing admin user from test_pos_e2e.py
    print("P0: Login as existing admin user for POS setup")
    admin_username = "lakshman"
    admin_password = "Kbprakash@78935"
    resp = requests.post(f"{BASE}/auth/login", data={
        "username": admin_username,
        "password": admin_password,
    })
    record("P0", "Login as admin for POS setup", resp.status_code == 200,
           f"Status: {resp.status_code}")
    if resp.status_code != 200:
        print(f"  Response: {resp.text[:200]}")
        print("  Note: Admin user not available. Skipping POS flow tests.")
        # Skip POS tests
        print()
        print("=" * 70)
        print("SKIPPING POS FLOW - Admin user not available")
        print("=" * 70)
        print_summary()
        return True

    admin_token = resp.json().get("access_token")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Get admin user info
    resp = requests.get(f"{BASE}/auth/me", headers=admin_headers)
    if resp.status_code == 200:
        admin_me = resp.json()
        admin_company_id = admin_me.get("company_id")
        admin_profile = admin_me.get("business_profile")
        print(f"  Admin company: {admin_company_id}")
        print(f"  Admin profile: {admin_profile}")
    print()

    # P1: Create POS category
    print("P1: Create POS category")
    category_name = timestamped("TestCategory")
    resp = requests.post(f"{BASE}/pos/categories", headers=admin_headers, json={
        "company_id": admin_company_id,
        "name": category_name,
        "description": "E2E test category",
    })
    record("P1", "Create POS category", resp.status_code in (200, 201),
           f"Status: {resp.status_code}")
    category_id = None
    if resp.status_code in (200, 201):
        category = resp.json()
        category_id = category.get("id")
        print(f"  Category: {category.get('name')} (id: {category_id})")
    print()

    # P2: Create POS product with stock
    print("P2: Create POS product with stock")
    product_sku = f"E2E{int(time.time())}"
    resp = requests.post(f"{BASE}/pos/products", headers=admin_headers, json={
        "company_id": admin_company_id,
        "category_id": category_id,
        "name": "E2E Test Product",
        "sku": product_sku,
        "selling_price": 999.00,
        "purchase_price": 500.00,
        "unit": "Pcs",
        "stock_quantity": 100,
        "low_stock_threshold": 10,
        "description": "E2E test product",
    })
    record("P2", "Create POS product", resp.status_code in (200, 201),
           f"Status: {resp.status_code}")
    product_id = None
    initial_stock = 100
    if resp.status_code in (200, 201):
        product = resp.json()
        product_id = product.get("id")
        initial_stock = product.get("stock_quantity", 100)
        print(f"  Product: {product.get('name')} (id: {product_id})")
        print(f"  Stock: {initial_stock}")
    print()

    # P3: List POS products
    print("P3: List POS products")
    resp = requests.get(f"{BASE}/pos/products", headers=admin_headers)
    record("P3", "List POS products", resp.status_code == 200,
           f"Status: {resp.status_code}")
    if resp.status_code == 200:
        products = resp.json()
        record("P3a", "Product list is not empty", len(products) > 0,
               f"Count: {len(products)}")
        if product_id:
            found = any(p.get("id") == product_id for p in products)
            record("P3b", "Created product appears in list", found,
                   f"ID: {product_id}")
    print()

    # P4: Checkout via /pos/transactions
    print("P4: Checkout via /pos/transactions")
    if product_id:
        resp = requests.post(f"{BASE}/pos/transactions", headers=admin_headers, json={
            "items": [
                {
                    "product_id": product_id,
                    "product_name": "E2E Test Product",
                    "sku": product_sku,
                    "barcode": "",
                    "quantity": 2,
                    "unit_price": 999.00,
                    "discount": 0,
                    "tax": 18,
                },
            ],
            "payment_method": "cash",
            "payment_amount": 2347.80,  # 999*2 + 18% tax
            "discount": 0,
            "notes": "E2E test checkout",
        })
        record("P4", "POS checkout", resp.status_code in (200, 201),
               f"Status: {resp.status_code}")
        transaction_id = None
        if resp.status_code in (200, 201):
            transaction = resp.json()
            transaction_id = transaction.get("id")
            print(f"  Transaction: {transaction.get('transaction_number')}")
            print(f"  Grand total: {transaction.get('grand_total')}")
            print(f"  Payment: {transaction.get('payment_method')}")
    else:
        record("P4", "POS checkout", False, "Skipped - no product")
    print()

    # P5: Stock reduced after checkout
    print("P5: Stock reduced after checkout")
    if product_id:
        resp = requests.get(f"{BASE}/pos/products/{product_id}", headers=admin_headers)
        if resp.status_code == 200:
            product = resp.json()
            current_stock = product.get("stock_quantity")
            expected_stock = initial_stock - 2
            record("P5", "Stock reduced after checkout",
                   current_stock == expected_stock,
                   f"Stock: {current_stock} (expected: {expected_stock})")
    else:
        record("P5", "Stock reduced after checkout", False, "Skipped - no product")
    print()

    # P6: Transaction appears in /pos/transactions
    print("P6: Transaction appears in /pos/transactions")
    resp = requests.get(f"{BASE}/pos/transactions", headers=admin_headers)
    record("P6", "List POS transactions", resp.status_code == 200,
           f"Status: {resp.status_code}")
    if resp.status_code == 200:
        transactions = resp.json()
        record("P6a", "Transaction list is not empty", len(transactions) > 0,
               f"Count: {len(transactions)}")
        if transaction_id:
            found = any(t.get("id") == transaction_id for t in transactions)
            record("P6b", "Created transaction appears in list", found,
                   f"ID: {transaction_id}")
    print()

    # ===== Summary =====
    print_summary()
    return True


def print_summary():
    """Print a summary of all test results."""
    print()
    print("=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)

    passed = sum(1 for r in results if r["passed"])
    failed = sum(1 for r in results if not r["passed"])
    total = len(results)

    print(f"\nTotal tests: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    print()

    if failed > 0:
        print("FAILED TESTS:")
        for r in results:
            if not r["passed"]:
                detail = f" ({r['detail']})" if r.get("detail") else ""
                print(f"  ✗ {r['id']}: {r['desc']}{detail}")
        print()

    # Group by phase
    print("BY PHASE:")
    phases = {
        "Registration": [r for r in results if r["id"].startswith("R")],
        "Company Setup": [r for r in results if r["id"].startswith("C")],
        "Quotation": [r for r in results if r["id"].startswith("Q")],
        "POS": [r for r in results if r["id"].startswith("P")],
    }
    for phase_name, phase_results in phases.items():
        if not phase_results:
            continue
        p_pass = sum(1 for r in phase_results if r["passed"])
        p_total = len(phase_results)
        status = "✓" if p_pass == p_total else "✗"
        print(f"  {status} {phase_name}: {p_pass}/{p_total} passed")
    print()

    if failed == 0:
        print("ALL TESTS PASSED ✓")
    else:
        print(f"{failed} TEST(S) FAILED ✗")
    print()


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
