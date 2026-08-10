import os
import sys

os.chdir(r'C:\Users\laxma\QuotationGenerator_UI\backend\backend')
sys.path.insert(0, os.getcwd())
import app.schemas.product as p
print(p.__file__)
print(p.ProductRead.model_fields['id'].annotation)
print(p.ProductRead.model_fields['created_at'].annotation)
