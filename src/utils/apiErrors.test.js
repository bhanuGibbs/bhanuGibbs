import assert from 'node:assert/strict';
import test from 'node:test';
import { getApiErrorMessage } from './apiErrors.js';

test('turns the finalized document limit into a readable plan message', () => {
  assert.equal(
    getApiErrorMessage({
      detail: 'Monthly limit of 10 finalized quotations/invoices for the Free plan reached. The limit resets at 2026-11-01 00:00 UTC.',
    }),
    'Your Free plan has reached its monthly limit of 10 finalized invoices and quotations. The limit resets on 1 November 2026.',
  );
});

test('extracts detail text instead of showing a JSON response body', () => {
  assert.equal(getApiErrorMessage('{"detail":"Customer name is required."}'), 'Customer name is required.');
});

test('provides a fallback for unrecognized response objects', () => {
  assert.equal(getApiErrorMessage('{"unexpected":true}', 'Unable to save.'), 'Unable to save.');
});

test('replaces generic internal server errors with a useful message', () => {
  assert.equal(
    getApiErrorMessage({ detail: 'Internal server error' }),
    'The server could not complete this request. Please try again shortly.',
  );
});

test('preserves a server reference ID in the user-friendly error', () => {
  assert.equal(
    getApiErrorMessage({ detail: 'Internal server error. Reference ID: abc123def456.' }),
    'The server could not complete this request. Reference ID: abc123def456. Please try again shortly.',
  );
});
