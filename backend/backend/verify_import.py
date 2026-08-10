import os
os.chdir(r'C:\Users\laxma\QuotationGenerator_UI\backend\backend')
import app.main
with open('import_check.txt', 'w', encoding='utf-8') as handle:
    handle.write('imported')
