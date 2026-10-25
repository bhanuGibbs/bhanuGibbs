import assert from 'node:assert/strict';
import test from 'node:test';
import {calculateItemAmount, calculateSummary, normalizeDocumentTotals} from './calculations.js';

test('calculates synchronized totals for quantities, discounts, GST rates, and shipping', () => {
    const items = [
        {quantity: 3, rate: 19.99, discount: 10, gst: 18},
        {quantity: 2, rate: 125, discount: 0, gst: 5},
    ];

    assert.deepEqual(calculateSummary(items, 15.55), {
        subtotal: 309.97,
        discount: 6,
        gstTotal: 22.21,
        shipping: 15.55,
        grandTotal: 341.73,
    });
    assert.deepEqual(items.map(calculateItemAmount), [63.68, 262.5]);
});

test('rounds each line discount and tax to currency precision before summing', () => {
    const items = [
        {quantity: 1, rate: 0.05, discount: 10, gst: 7.5},
        {quantity: 3, rate: 1.01, discount: 0, gst: 8.25},
    ];

    assert.deepEqual(calculateSummary(items, 1.12), {
        subtotal: 3.08,
        discount: 0.01,
        gstTotal: 0.25,
        shipping: 1.12,
        grandTotal: 4.44,
    });
    assert.deepEqual(items.map(calculateItemAmount), [0.04, 3.28]);
});

test('returns the latest summary for each changed item set', () => {
    const originalItems = [{quantity: 1, rate: 100, discount: 0, gst: 0}];
    const updatedItems = [{quantity: 4, rate: 75, discount: 20, gst: 12}];

    assert.equal(calculateSummary(originalItems, 0).grandTotal, 100);
    assert.equal(calculateSummary(updatedItems, 0).grandTotal, 268.8);
});

test('rebuilds PDF totals from current line items instead of stale summary data', () => {
    const pdfData = normalizeDocumentTotals({
        items: [{quantity: 2, rate: 50, discount: 10, gst: 18}],
        shipping: 5,
        summary: {subtotal: 1, discount: 0, gstTotal: 0, shipping: 0, grandTotal: 1},
    });

    assert.deepEqual(pdfData.summary, {
        subtotal: 100,
        discount: 10,
        gstTotal: 16.2,
        shipping: 5,
        grandTotal: 111.2,
    });
});
