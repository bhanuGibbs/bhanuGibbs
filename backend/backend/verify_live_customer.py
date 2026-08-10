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
payload = json.dumps({'name': 'Live Customer 3', 'email': 'live3@example.com', 'phone_number': '9999999997', 'address': 'Live Address 3', 'company_name': 'Live Co 3'}).encode()
req = urllib.request.Request(base + '/customers/', data=payload, method='POST', headers=headers)
try:
    with urllib.request.urlopen(req) as resp:
        print('CUSTOMER_STATUS', resp.status)
        print(resp.read().decode())
except urllib.error.HTTPError as e:
    print('CUSTOMER_STATUS', e.code)
    print(e.read().decode())
except Exception as exc:
    print('REQUEST_ERROR', exc)
