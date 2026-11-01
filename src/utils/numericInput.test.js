import test from 'node:test';
import assert from 'node:assert/strict';
import { digitsOnly, PHONE_NUMBER_REGEX, PINCODE_REGEX } from './numericInput.js';

test('phone input keeps at most 10 digits and ignores non-digits', () => {
  assert.equal(digitsOnly('98a765-43210', 10), '9876543210');
  assert.equal(digitsOnly('123456789012', 10), '1234567890');
});

test('pincode input keeps at most 6 digits and ignores non-digits', () => {
  assert.equal(digitsOnly('12ab 45678', 6), '124567');
});

test('phone and pincode validation require exactly 10 and 6 digits', () => {
  assert.equal(PHONE_NUMBER_REGEX.test('9876543210'), true);
  assert.equal(PHONE_NUMBER_REGEX.test('987654321'), false);
  assert.equal(PHONE_NUMBER_REGEX.test('98765a3210'), false);
  assert.equal(PINCODE_REGEX.test('123456'), true);
  assert.equal(PINCODE_REGEX.test('12345'), false);
  assert.equal(PINCODE_REGEX.test('12345a'), false);
});
