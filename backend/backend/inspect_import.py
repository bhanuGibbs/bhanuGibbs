import inspect
import os
import sys

os.chdir(r'C:\Users\laxma\QuotationGenerator_UI\backend\backend')
sys.path.insert(0, os.getcwd())
import app.api.customer_router as cr

with open('inspect_import_output.txt', 'w', encoding='utf-8') as handle:
    handle.write(os.getcwd() + '\n')
    handle.write(cr.__file__ + '\n')
    handle.write(inspect.getsource(cr.delete_customer))
