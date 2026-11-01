import assert from 'node:assert/strict';
import { after, test } from 'node:test';

const originalFetch = globalThis.fetch;
const originalWindow = globalThis.window;
const accessToken = `${Buffer.from('{}').toString('base64url')}.${Buffer.from(
  JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }),
).toString('base64url')}.test-signature`;

globalThis.window = {
  localStorage: {
    getItem: (key) => key === 'quotation_backend_token' ? accessToken : null,
    setItem: () => {},
    removeItem: () => {},
  },
  dispatchEvent: () => true,
};

const { submitQuotationToBackend } = await import('./api.js');

after(() => {
  globalThis.fetch = originalFetch;
  if (originalWindow === undefined) delete globalThis.window;
  else globalThis.window = originalWindow;
});

test('submits a finalized quotation directly through the submit endpoint', async () => {
  const requests = [];
  globalThis.fetch = async (url, init) => {
    requests.push({ url, init });
    return new Response(JSON.stringify({
      id: 'quotation-id',
      status: 'Final',
      reference_number: 'QT-USER-0001',
      quotation_number: 'QT-30102026-001',
    }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  };

  const result = await submitQuotationToBackend({
    documentType: 'quotation',
    quotation: {
      quotationNumber: '',
      quotationDate: '2026-10-30',
      validUntil: '2026-11-06',
      currency: 'INR',
      terms: 'Net 7 days',
    },
    customer: { name: 'Customer' },
    items: [{ itemName: 'Item', quantity: 1, rate: 10, discount: 0, gst: 0 }],
    shipping: 0,
  });

  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, '/api/quotations/submit');
  assert.equal(requests[0].init.method, 'POST');
  assert.equal(new Headers(requests[0].init.headers).has('Authorization'), true);
  assert.equal(result.status, 'Final');
  const payload = JSON.parse(requests[0].init.body);
  assert.equal(payload.valid_until, '2026-11-06');
  assert.equal(payload.terms, 'Net 7 days');
});
