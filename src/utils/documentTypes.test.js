import assert from 'node:assert/strict';
import test from 'node:test';
import {
    getDeliveryChallanPaymentStatus,
    getInvoicePaymentStatus,
    isInvoiceDocument,
} from './documentTypes.js';

test('recognizes current and legacy invoice document titles', () => {
    assert.equal(isInvoiceDocument({title: 'Invoice'}), true);
    assert.equal(isInvoiceDocument({title: 'billing'}), true);
    assert.equal(isInvoiceDocument({title: 'Quotation'}), false);
    assert.equal(isInvoiceDocument({}), false);
});

test('maps finalized invoices to unpaid and preserves non-payment statuses', () => {
    assert.equal(getInvoicePaymentStatus({status: 'Final'}), 'Unpaid');
    assert.equal(getInvoicePaymentStatus({status: 'Unpaid'}), 'Unpaid');
    assert.equal(getInvoicePaymentStatus({status: 'paid'}), 'Paid');
    assert.equal(getInvoicePaymentStatus({status: 'Draft'}), 'Draft');
});

test('maps finalized delivery challans to unpaid and preserves draft status', () => {
    assert.equal(getDeliveryChallanPaymentStatus({status: 'Final'}), 'Unpaid');
    assert.equal(getDeliveryChallanPaymentStatus({status: 'Finalized'}), 'Unpaid');
    assert.equal(getDeliveryChallanPaymentStatus({status: 'Unpaid'}), 'Unpaid');
    assert.equal(getDeliveryChallanPaymentStatus({status: 'paid'}), 'Paid');
    assert.equal(getDeliveryChallanPaymentStatus({status: 'Draft'}), 'Draft');
});
