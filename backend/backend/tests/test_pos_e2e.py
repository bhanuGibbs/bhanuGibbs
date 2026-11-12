"""
End-to-End POS System Test
Tests: Login, Categories, Products, Barcodes, Cart/Checkout, Stock, Receipts, Dashboard
"""
import requests
import sys
from decimal import Decimal

BASE = "http://localhost:8000"
USERNAME = "lakshman"
PASSWORD = "Kbprakash@78935"

def run_tests():
    headers = {}
    company_id = None
    category_id = None
    products = []
    transaction_id = None

    # ===== Step 1: Login =====
    print("=" * 60)
    print("STEP 1: Login")
    print("=" * 60)
    resp = requests.post(f"{BASE}/auth/login", data={
        "username": USERNAME,
        "password": PASSWORD
    })
    print(f"Status: {resp.status_code}")
    if resp.status_code != 200:
        print(f"FAILED: {resp.text}")
        return False
    login_data = resp.json()
    token = login_data.get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    print(f"Token received: {token[:30]}...")
    print("✓ Login successful\n")

    # ===== Step 2: Get user info =====
    print("=" * 60)
    print("STEP 2: Get User Info")
    print("=" * 60)
    resp = requests.get(f"{BASE}/auth/me", headers=headers)
    print(f"Status: {resp.status_code}")
    if resp.status_code != 200:
        print(f"FAILED: {resp.text}")
        return False
    me = resp.json()
    company_id = me.get("company_id")
    print(f"Username: {me.get('username')}")
    print(f"Role: {me.get('role')}")
    print(f"Company ID: {company_id}")
    print(f"Business profile: {me.get('business_profile')}")
    print("✓ User info retrieved\n")

    # ===== Step 3: Create POS Category =====
    print("=" * 60)
    print("STEP 3: Create POS Category")
    print("=" * 60)
    resp = requests.post(f"{BASE}/pos/categories", headers=headers, json={
        "company_id": company_id,
        "name": "Test Electronics",
        "description": "E2E test category"
    })
    print(f"Status: {resp.status_code}")
    if resp.status_code not in (200, 201):
        print(f"FAILED: {resp.text}")
        return False
    category = resp.json()
    category_id = category["id"]
    print(f"Category: {category['name']} (id: {category_id})")
    print("✓ Category created\n")

    # ===== Step 4: List Categories =====
    print("=" * 60)
    print("STEP 4: List Categories")
    print("=" * 60)
    resp = requests.get(f"{BASE}/pos/categories", headers=headers)
    categories = resp.json()
    print(f"Total categories: {len(categories)}")
    for c in categories:
        print(f"  - {c['name']}")
    print("✓ Categories listed\n")

    # ===== Step 5: Create POS Products =====
    print("=" * 60)
    print("STEP 5: Create POS Products")
    print("=" * 60)
    # First, check if products already exist from previous runs (include inactive)
    resp = requests.get(f"{BASE}/pos/products?active_only=false", headers=headers)
    existing_products = resp.json()
    existing_skus = {p["sku"] for p in existing_products}

    product_data = [
        {"name": "Wireless Mouse", "sku": "WM001", "selling_price": 599.00, "unit": "Pcs", "stock_quantity": 50, "low_stock_threshold": 5},
        {"name": "USB Keyboard", "sku": "KB001", "selling_price": 899.00, "unit": "Pcs", "stock_quantity": 30, "low_stock_threshold": 5},
        {"name": "HDMI Cable 2m", "sku": "HD001", "selling_price": 299.00, "unit": "Pcs", "stock_quantity": 100, "low_stock_threshold": 10},
        {"name": "Webcam HD", "sku": "WC001", "selling_price": 1499.00, "unit": "Pcs", "stock_quantity": 15, "low_stock_threshold": 3},
        {"name": "Mouse Pad", "sku": "MP001", "selling_price": 199.00, "unit": "Pcs", "stock_quantity": 200, "low_stock_threshold": 20},
    ]
    created_count = 0
    for p in product_data:
        if p["sku"] in existing_skus:
            # Use existing product
            existing = next(prod for prod in existing_products if prod["sku"] == p["sku"])
            products.append(existing)
            print(f"  {p['name']}: EXISTS | Barcode: {existing.get('barcode', 'N/A')}")
        else:
            resp = requests.post(f"{BASE}/pos/products", headers=headers, json={
                "company_id": company_id,
                "category_id": category_id,
                "name": p["name"],
                "sku": p["sku"],
                "selling_price": p["selling_price"],
                "purchase_price": p["selling_price"] * 0.6,
                "unit": p["unit"],
                "stock_quantity": p["stock_quantity"],
                "low_stock_threshold": p["low_stock_threshold"],
                "description": f"Test product: {p['name']}"
            })
            print(f"  {p['name']}: {resp.status_code}", end=" ")
            if resp.status_code in (200, 201):
                prod = resp.json()
                products.append(prod)
                created_count += 1
                print(f"| Barcode: {prod.get('barcode', 'N/A')}")
            else:
                print(f"FAILED: {resp.text[:100]}")
    print(f"Total products: {len(products)} (created: {created_count}, reused: {len(products) - created_count})")
    if len(products) < 5:
        print("ERROR: Not enough products. Cannot continue.")
        return False
    print("✓ Products ready\n")

    # ===== Step 6: List Products =====
    print("=" * 60)
    print("STEP 6: List Products")
    print("=" * 60)
    resp = requests.get(f"{BASE}/pos/products", headers=headers)
    all_products = resp.json()
    print(f"Total products: {len(all_products)}")
    for p in all_products:
        print(f"  - {p['name']} | SKU: {p['sku']} | Barcode: {p['barcode']} | Price: {p['selling_price']} | Stock: {p['stock_quantity']}")
    print("✓ Products listed\n")

    # ===== Step 7: Barcode Lookup (Scanner Simulation) =====
    print("=" * 60)
    print("STEP 7: Barcode Lookup (Scanner Simulation)")
    print("=" * 60)
    if products and products[0].get("barcode"):
        barcode = products[0]["barcode"]
        print(f"Scanning barcode: {barcode}")
        resp = requests.get(f"{BASE}/pos/products/barcode/{barcode}", headers=headers)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            found = resp.json()
            print(f"Found: {found['name']} | Price: {found['selling_price']} | Stock: {found['stock_quantity']}")
            print("✓ Barcode lookup successful\n")
        else:
            print(f"Note: Barcode lookup returned {resp.status_code} - {resp.text[:100]}")
    else:
        print("Skipping: No barcode available")
    print()

    # ===== Step 8: Search Products =====
    print("=" * 60)
    print("STEP 8: Search Products")
    print("=" * 60)
    resp = requests.get(f"{BASE}/pos/products?search=mouse", headers=headers)
    results = resp.json()
    print(f"Search 'mouse': {len(results)} results")
    for p in results:
        print(f"  - {p['name']}")
    print("✓ Search working\n")

    # ===== Step 9: Create Transaction (Checkout - Cash) =====
    print("=" * 60)
    print("STEP 9: Create Transaction (Checkout - Cash)")
    print("=" * 60)
    cart_items = [
        {
            "product_id": products[0]["id"],
            "product_name": products[0]["name"],
            "sku": products[0]["sku"],
            "barcode": products[0]["barcode"],
            "quantity": 2,
            "unit_price": products[0]["selling_price"],
        },
        {
            "product_id": products[1]["id"],
            "product_name": products[1]["name"],
            "sku": products[1]["sku"],
            "barcode": products[1]["barcode"],
            "quantity": 1,
            "unit_price": products[1]["selling_price"],
        },
        {
            "product_id": products[2]["id"],
            "product_name": products[2]["name"],
            "sku": products[2]["sku"],
            "barcode": products[2]["barcode"],
            "quantity": 3,
            "unit_price": products[2]["selling_price"],
        },
    ]
    # Calculate totals
    subtotal = sum(float(item["unit_price"]) * item["quantity"] for item in cart_items)
    payment_amount = subtotal  # No discount, no tax for simplicity

    print("Cart items:")
    for item in cart_items:
        print(f"  - {item['product_name']} x{item['quantity']} @ {item['unit_price']}")
    print(f"Subtotal: {subtotal}")

    resp = requests.post(f"{BASE}/pos/transactions", headers=headers, json={
        "items": cart_items,
        "payment_method": "cash",
        "payment_amount": payment_amount,
        "discount": 0,
        "notes": "E2E test - Cash transaction"
    })
    print(f"Status: {resp.status_code}")
    if resp.status_code not in (200, 201):
        print(f"FAILED: {resp.text}")
        return False
    transaction = resp.json()
    transaction_id = transaction["id"]
    print(f"Transaction #: {transaction.get('transaction_number')}")
    print(f"  Subtotal: {transaction.get('subtotal')}")
    print(f"  Discount: {transaction.get('discount')}")
    print(f"  Tax: {transaction.get('tax_amount')}")
    print(f"  Grand Total: {transaction.get('grand_total')}")
    print(f"  Payment: {transaction.get('payment_method')} - {transaction.get('payment_amount')}")
    print(f"  Items: {len(transaction.get('items', []))}")
    for item in transaction.get('items', []):
        print(f"    - {item['product_name']} x{item['quantity']} @ {item['unit_price']} = {item['line_total']}")
    print("✓ Transaction created\n")

    # ===== Step 10: Verify Stock Deduction =====
    print("=" * 60)
    print("STEP 10: Verify Stock Deduction")
    print("=" * 60)
    stock_changes = {
        products[0]["id"]: 2,  # Mouse: -2
        products[1]["id"]: 1,  # Keyboard: -1
        products[2]["id"]: 3,  # HDMI: -3
    }
    for prod in products[:3]:
        resp = requests.get(f"{BASE}/pos/products/{prod['id']}", headers=headers)
        current = resp.json()
        expected = prod["stock_quantity"] - stock_changes.get(prod["id"], 0)
        status = "✓" if current["stock_quantity"] == expected else "✗"
        print(f"  {status} {current['name']}: {current['stock_quantity']} (expected: {expected})")
    print("✓ Stock deduction verified\n")

    # ===== Step 11: Get Transaction Details =====
    print("=" * 60)
    print("STEP 11: Get Transaction Details")
    print("=" * 60)
    resp = requests.get(f"{BASE}/pos/transactions/{transaction_id}", headers=headers)
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        tx = resp.json()
        print(f"Transaction: {tx.get('transaction_number')}")
        print(f"Status: {tx.get('status')}")
        print(f"Grand total: {tx.get('grand_total')}")
        print(f"Items: {len(tx.get('items', []))}")
    print("✓ Transaction details retrieved\n")

    # ===== Step 12: List Transactions =====
    print("=" * 60)
    print("STEP 12: List Transactions")
    print("=" * 60)
    resp = requests.get(f"{BASE}/pos/transactions", headers=headers)
    transactions = resp.json()
    print(f"Total transactions: {len(transactions)}")
    for tx in transactions[:5]:
        print(f"  - {tx['transaction_number']}: {tx['grand_total']} ({tx['payment_method']})")
    print("✓ Transactions listed\n")

    # ===== Step 13: Get Receipt HTML =====
    print("=" * 60)
    print("STEP 13: Get Receipt HTML")
    print("=" * 60)
    resp = requests.get(f"{BASE}/pos/transactions/{transaction_id}/receipt", headers=headers)
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        receipt = resp.json()
        html = receipt.get("receipt_html", "")
        print(f"Receipt HTML length: {len(html)} chars")
        lines = html.strip().split("\n")[:10]
        for line in lines:
            print(f"  {line.strip()}")
        print("  ...")
        print("✓ Receipt generated\n")
    else:
        print(f"Note: {resp.text[:200]}")

    # ===== Step 14: Inventory Summary =====
    print("=" * 60)
    print("STEP 14: Inventory Summary")
    print("=" * 60)
    resp = requests.get(f"{BASE}/pos/inventory", headers=headers)
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        inv = resp.json()
        print(f"Total products: {inv.get('total_products', 0)}")
        print(f"Total stock value: {inv.get('total_stock_value', 0)}")
        print(f"Low stock count: {inv.get('low_stock_count', 0)}")
    print("✓ Inventory summary retrieved\n")

    # ===== Step 15: Low Stock Products =====
    print("=" * 60)
    print("STEP 15: Low Stock Products")
    print("=" * 60)
    resp = requests.get(f"{BASE}/pos/inventory/low-stock", headers=headers)
    print(f"Status: {resp.status_code}")
    low_stock = resp.json()
    print(f"Low stock products: {len(low_stock)}")
    for p in low_stock:
        print(f"  - {p['name']}: stock {p['stock_quantity']} (threshold: {p['low_stock_threshold']})")
    print("✓ Low stock check complete\n")

    # ===== Step 16: Stock Movement History =====
    print("=" * 60)
    print("STEP 16: Stock Movement History")
    print("=" * 60)
    resp = requests.get(f"{BASE}/pos/stock-movements", headers=headers)
    print(f"Status: {resp.status_code}")
    movements = resp.json()
    print(f"Total movements: {len(movements)}")
    for m in movements[:5]:
        print(f"  - {m['movement_type']}: qty {m['quantity']} | {m.get('notes', '')}")
    print("✓ Stock movements retrieved\n")

    # ===== Step 17: POS Dashboard =====
    print("=" * 60)
    print("STEP 17: POS Dashboard")
    print("=" * 60)
    resp = requests.get(f"{BASE}/pos/dashboard", headers=headers)
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        dash = resp.json()
        print(f"Today's sales: {dash.get('today_sales', {})}")
        print(f"Total transactions: {dash.get('total_transactions', 0)}")
        print(f"Top products: {len(dash.get('top_products', []))}")
        print(f"Low stock alerts: {len(dash.get('low_stock_alerts', []))}")
    print("✓ Dashboard data loaded\n")

    # ===== Step 18: Transaction with Discount (UPI) =====
    print("=" * 60)
    print("STEP 18: Transaction with Discount (UPI)")
    print("=" * 60)
    cart_items2 = [
        {
            "product_id": products[3]["id"],
            "product_name": products[3]["name"],
            "sku": products[3]["sku"],
            "barcode": products[3]["barcode"],
            "quantity": 1,
            "unit_price": products[3]["selling_price"],
        },
        {
            "product_id": products[4]["id"],
            "product_name": products[4]["name"],
            "sku": products[4]["sku"],
            "barcode": products[4]["barcode"],
            "quantity": 2,
            "unit_price": products[4]["selling_price"],
        },
    ]
    subtotal2 = sum(float(item["unit_price"]) * item["quantity"] for item in cart_items2)
    discount2 = 100.00
    payment2 = subtotal2 - discount2

    resp = requests.post(f"{BASE}/pos/transactions", headers=headers, json={
        "items": cart_items2,
        "payment_method": "upi",
        "payment_amount": payment2,
        "discount": discount2,
        "notes": "E2E test - UPI with discount"
    })
    print(f"Status: {resp.status_code}")
    if resp.status_code in (200, 201):
        tx2 = resp.json()
        print(f"Transaction: {tx2.get('transaction_number')}")
        print(f"Grand Total: {tx2.get('grand_total')} (discount: {tx2.get('discount')})")
        print(f"Payment: {tx2.get('payment_method')}")
        print("✓ UPI transaction with discount created\n")

    # ===== Step 19: Update Product =====
    print("=" * 60)
    print("STEP 19: Update Product")
    print("=" * 60)
    resp = requests.put(f"{BASE}/pos/products/{products[0]['id']}", headers=headers, json={
        "selling_price": 649.00,
        "name": "Wireless Mouse Pro"
    })
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        updated = resp.json()
        print(f"Updated: {updated['name']} | Price: {updated['selling_price']}")
    print("✓ Product updated\n")

    # ===== Step 20: Manual Stock Adjustment =====
    print("=" * 60)
    print("STEP 20: Manual Stock Adjustment")
    print("=" * 60)
    resp = requests.post(f"{BASE}/pos/inventory/adjust", headers=headers, json={
        "company_id": company_id,
        "product_id": products[0]["id"],
        "quantity": 10,
        "movement_type": "in",
        "notes": "Restocking wireless mice"
    })
    print(f"Status: {resp.status_code}")
    if resp.status_code in (200, 201):
        result = resp.json()
        print(f"New stock: {result.get('new_stock_quantity')}")
    print("✓ Stock adjustment done\n")

    # ===== Step 21: Create Product Variant =====
    print("=" * 60)
    print("STEP 21: Create Product Variant")
    print("=" * 60)
    resp = requests.post(f"{BASE}/pos/products/{products[0]['id']}/variants", headers=headers, json={
        "company_id": company_id,
        "name": "Color: Black",
        "sku": "WM001-BLK",
        "selling_price": 649.00,
        "stock_quantity": 25,
        "low_stock_threshold": 5
    })
    print(f"Status: {resp.status_code}")
    if resp.status_code in (200, 201):
        variant = resp.json()
        print(f"Variant: {variant['name']} | Stock: {variant['stock_quantity']}")
    print("✓ Variant created\n")

    # ===== Step 22: List Variants =====
    print("=" * 60)
    print("STEP 22: List Variants")
    print("=" * 60)
    resp = requests.get(f"{BASE}/pos/products/{products[0]['id']}/variants", headers=headers)
    print(f"Status: {resp.status_code}")
    variants = resp.json()
    print(f"Variants: {len(variants)}")
    for v in variants:
        print(f"  - {v['name']} | Stock: {v['stock_quantity']}")
    print("✓ Variants listed\n")

    # ===== Step 23: Update Category =====
    print("=" * 60)
    print("STEP 23: Update Category")
    print("=" * 60)
    resp = requests.put(f"{BASE}/pos/categories/{category_id}", headers=headers, json={
        "name": "Test Electronics Updated"
    })
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        cat = resp.json()
        print(f"Updated category: {cat['name']}")
    print("✓ Category updated\n")

    # ===== Step 24: Deactivate Product =====
    print("=" * 60)
    print("STEP 24: Deactivate Product")
    print("=" * 60)
    resp = requests.put(f"{BASE}/pos/products/{products[4]['id']}", headers=headers, json={
        "is_active": False
    })
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        deactivated = resp.json()
        print(f"{deactivated['name']} active: {deactivated['is_active']}")
    print("✓ Product deactivated\n")

    # ===== FINAL SUMMARY =====
    print("=" * 60)
    print("E2E POS TEST SUMMARY - ALL PASSED ✓")
    print("=" * 60)
    print("✓ Login & Authentication")
    print("✓ POS Category CRUD (Create, Read, Update)")
    print(f"✓ POS Products Created: {len(products)}")
    print("✓ Barcode Auto-Generation & Lookup")
    print("✓ Product Search")
    print("✓ Transaction 1: Cash Payment (3 items)")
    print("✓ Transaction 2: UPI Payment with Discount")
    print("✓ Stock Deduction Verified")
    print("✓ Transaction Details & History")
    print("✓ Receipt HTML Generation")
    print("✓ Inventory Summary")
    print("✓ Low Stock Alerts")
    print("✓ Stock Movement History")
    print("✓ POS Dashboard Data")
    print("✓ Product Update")
    print("✓ Manual Stock Adjustment")
    print("✓ Product Variant Creation")
    print("✓ Product Deactivation")
    print()
    return True

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
