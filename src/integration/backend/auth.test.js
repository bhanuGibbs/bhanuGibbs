import assert from 'node:assert/strict';
import { after, test } from 'node:test';

const originalFetch = globalThis.fetch;
const storage = new Map();
const sessionEvents = [];

globalThis.window = {
  localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
  },
  dispatchEvent: (event) => {
    sessionEvents.push(event.type);
    return true;
  },
};

const { authenticatedFetch } = await import('./auth.js');

const token = (expiresAt) => {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ exp: expiresAt })).toString('base64url');
  return `${header}.${payload}.test-signature`;
};

const validToken = () => token(Math.floor(Date.now() / 1000) + 3600);
const expiredToken = () => token(Math.floor(Date.now() / 1000) - 60);
const jsonResponse = (payload, status = 200) => new Response(JSON.stringify(payload), {
  status,
  headers: { 'Content-Type': 'application/json' },
});

const setTokens = (accessToken = validToken(), refreshToken = 'refresh-old') => {
  storage.set('quotation_backend_token', accessToken);
  storage.set('quotation_backend_refresh_token', refreshToken);
};

const reset = () => {
  storage.clear();
  sessionEvents.length = 0;
};

after(() => {
  globalThis.fetch = originalFetch;
  delete globalThis.window;
});

test('refreshes an unauthorized request and retries it with the new access token', async () => {
  reset();
  const oldAccessToken = validToken();
  setTokens(oldAccessToken);
  const accessToken = validToken();
  const refreshToken = 'refresh-new';
  const requests = [];

  globalThis.fetch = async (url, init = {}) => {
    requests.push({ url, init });
    if (url === '/api/auth/refresh') {
      assert.deepEqual(JSON.parse(init.body), { refresh_token: 'refresh-old' });
      return jsonResponse({ access_token: accessToken, refresh_token: refreshToken });
    }
    if (requests.filter((request) => request.url === '/api/resource').length === 1) {
      return jsonResponse({ detail: 'Invalid authentication credentials.' }, 401);
    }
    return jsonResponse({ ok: true });
  };

  const response = await authenticatedFetch('/api/resource');

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(requests.length, 3);
  assert.equal(new Headers(requests[0].init.headers).get('Authorization'), `Bearer ${oldAccessToken}`);
  assert.equal(new Headers(requests[2].init.headers).get('Authorization'), `Bearer ${accessToken}`);
  assert.equal(storage.get('quotation_backend_refresh_token'), refreshToken);
  assert.deepEqual(sessionEvents, []);
});

test('refreshes when the stored access token has expired locally', async () => {
  reset();
  setTokens(expiredToken(), 'refresh-current');
  const newAccessToken = validToken();
  const requests = [];

  globalThis.fetch = async (url, init = {}) => {
    requests.push({ url, init });
    if (url === '/api/auth/refresh') {
      return jsonResponse({ access_token: newAccessToken, refresh_token: 'refresh-rotated' });
    }
    if (requests.filter((request) => request.url === '/api/resource').length === 1) {
      assert.equal(new Headers(init.headers).has('Authorization'), false);
      return jsonResponse({ detail: 'Invalid authentication credentials.' }, 401);
    }
    return jsonResponse({ ok: true });
  };

  const response = await authenticatedFetch('/api/resource');

  assert.equal(response.status, 200);
  assert.equal(requests.length, 3);
  assert.equal(new Headers(requests[2].init.headers).get('Authorization'), `Bearer ${newAccessToken}`);
  assert.equal(storage.get('quotation_backend_refresh_token'), 'refresh-rotated');
  assert.deepEqual(sessionEvents, []);
});

test('clears an expired session and emits the event used to show the sign-in notice', async () => {
  reset();
  setTokens();

  globalThis.fetch = async (url) => {
    if (url === '/api/auth/refresh') {
      return jsonResponse({ detail: 'Invalid refresh token.' }, 401);
    }
    return jsonResponse({ detail: 'Invalid authentication credentials.' }, 401);
  };

  await assert.rejects(
    authenticatedFetch('/api/resource'),
    { message: 'Your session has expired. Please sign in again.' },
  );
  assert.equal(storage.has('quotation_backend_token'), false);
  assert.equal(storage.has('quotation_backend_refresh_token'), false);
  assert.deepEqual(sessionEvents, ['ledger:session-expired']);
});

test('reports a refresh connection failure without treating the session as expired', async () => {
  reset();
  setTokens();

  globalThis.fetch = async (url) => {
    if (url === '/api/auth/refresh') throw new TypeError('Network unavailable');
    return jsonResponse({ detail: 'Invalid authentication credentials.' }, 401);
  };

  await assert.rejects(
    authenticatedFetch('/api/resource'),
    { message: 'We could not refresh your session. Check your connection and try again.' },
  );
  assert.equal(storage.has('quotation_backend_token'), true);
  assert.equal(storage.has('quotation_backend_refresh_token'), true);
  assert.deepEqual(sessionEvents, []);
});
