import assert from 'node:assert/strict';
import test from 'node:test';
import { sanitizePdfData, sanitizePdfText } from './pdfText.js';

test('keeps supported text and replaces unsupported glyphs before PDF rendering', () => {
  assert.equal(sanitizePdfText('Café ₹ 100'), 'Café INR 100');
  assert.deepEqual(sanitizePdfData({ customer: { name: 'किरण' }, items: ['Chair'] }), {
    customer: { name: '????' },
    items: ['Chair'],
  });
});
