import inspect
import os
import sys

os.chdir(r'C:\Users\laxma\QuotationGenerator_UI\backend\backend')
sys.path.insert(0, os.getcwd())
import app.api.customer_router as customer_router
import app.api.product_router as product_router

print(inspect.getsource(customer_router.delete_customer))
print('---')
print(inspect.getsource(product_router.delete_product))
