import {createElement} from 'react';
import {pdf} from '@react-pdf/renderer';
import QuotationPDF from './QuotationPDF';
import {calculateSummary, normalizeDocumentTotals} from '../utils/calculations';

export const normalizeDocumentPdfData = normalizeDocumentTotals;

export const createDocumentPdfBlob = (data) =>
    pdf(createElement(QuotationPDF, {data: normalizeDocumentPdfData(data)})).toBlob();

export const downloadPdfUrl = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
};

export const downloadPdfBlob = async (blob, filename) => {
    const url = URL.createObjectURL(blob);
    downloadPdfUrl(url, filename);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const formatPdfDate = (value) => {
    if (!value) return '';
    const date = new Date(`${String(value).slice(0, 10)}T00:00:00Z`);
    return Number.isNaN(date.getTime())
        ? String(value)
        : new Intl.DateTimeFormat('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            timeZone: 'UTC',
        }).format(date);
};

export const buildSavedDocumentPdfData = (document, user) => {
    const items = (document.items || []).map((item) => ({
        id: item.id,
        itemName: item.item_name || item.product_name || 'Item',
        quantity: Number(item.quantity || 0),
        rate: Number(item.unit_price || 0),
        discount: Number(item.discount || 0),
        gst: Number(item.gst ?? item.tax_percentage ?? 0),
    }));
    const shipping = Number(document.shipping_amount || 0);

    return {
        generatedAt: formatPdfDate(document.issued_at || document.created_at),
        documentType: ['invoice', 'billing'].includes(
            String(document.title || '').trim().toLowerCase()
        )
            ? 'invoice' : 'quotation',

        company: {
            name: document.company_name || user?.company_name || '',
            address: document.company_address || user?.company_address || '',
            phone: document.company_phone_number || user?.company_phone_number || user?.mobile_number || '',
            email: document.company_email || user?.company_email || user?.email || '',
            website: document.company_website || user?.company_website || '',
            gstin: document.company_gstin || user?.company_gstin || '',
        },
        customer: {
            name: document.customer_name || '',
            address: document.customer_address || '',
            phone: document.customer_phone_number || '',
            email: document.customer_email || '',
            gstNumber: document.customer_gstin || '',
        },
        quotation: {
            quotationNumber: document.quotation_number || document.reference_number || '',
            quotationDate: formatPdfDate(document.issued_at),
            validUntil: formatPdfDate(document.valid_until),
            currency: document.currency || 'INR',
            terms: document.terms || '',
            authorizedPerson: user?.username || user?.name || '',
        },
        items,
        shipping,
        summary: calculateSummary(items, shipping),
    };
};
