import json
import time
import urllib.error
import urllib.parse
import urllib.request

username = 'testuser' + time.strftime('%Y%m%d%H%M%S')
body = json.dumps({
    'username': username,
    'email': f'{username}@example.com',
    'password': 'TestPass123!',
    'mobile_number': '1234567890',
}).encode('utf-8')
req = urllib.request.Request(
    'http://127.0.0.1:8000/auth/register',
    data=body,
    headers={'Content-Type': 'application/json'},
)
try:
    resp = urllib.request.urlopen(req)
    print('REGISTER', resp.status)
    print(resp.read().decode())
except urllib.error.HTTPError as e:
    print('REGISTER_ERROR', e.code)
    print(e.read().decode())
    raise

login_data = urllib.parse.urlencode(
    {'username': username, 'password': 'TestPass123!'}
).encode('utf-8')
req = urllib.request.Request(
    'http://127.0.0.1:8000/auth/login',
    data=login_data,
    headers={'Content-Type': 'application/x-www-form-urlencoded'},
)
try:
    resp = urllib.request.urlopen(req)
    data = json.loads(resp.read().decode())
    print('LOGIN OK', len(data['access_token']))
except urllib.error.HTTPError as e:
    print('LOGIN_ERROR', e.code)
    print(e.read().decode())
    raise

req = urllib.request.Request(
    'http://127.0.0.1:8000/auth/me',
    headers={'Authorization': 'Bearer ' + data['access_token']},
)
try:
    resp = urllib.request.urlopen(req)
    me = json.loads(resp.read().decode())
    print('ME', json.dumps(me, indent=2))
except urllib.error.HTTPError as e:
    print('ME_ERROR', e.code)
    print(e.read().decode())
    raise
