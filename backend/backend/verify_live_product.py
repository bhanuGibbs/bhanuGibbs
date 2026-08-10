import json
import sys
import urllib.request
import urllib.error

base = 'http://127.0.0.1:8000'
body = 'username=adminuser3&password=Password123!'.encode()
req = urllib.request.Request(base + '/auth/login', data=body, method='POST', headers={'Content-Type': 'application/x-www-form-urlencoded'})
try:
    with urllib.request.urlopen(req) as resp:
        token = json.loads(resp.read().decode())['access_token']
except Exception as exc:
    print('LOGIN_ERROR', exc)
    sys.exit(1)

headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
payload = json.dumps({'name': 'Live Product 2', 'description': 'Live test product', 'price': 12.5, 'sku': 'LIVE-PROD-002'}).encode()
req = urllib.request.Request(base + '/products/', data=payload, method='POST', headers=headers)
try:
    with urllib.request.urlopen(req) as resp:
        print('PRODUCT_STATUS', resp.status)
        print(resp.read().decode())
except urllib.error.HTTPError as e:
    print('PRODUCT_STATUS', e.code)
    print(e.read().decode())
except Exception as exc:
    print('REQUEST_ERROR', exc)
