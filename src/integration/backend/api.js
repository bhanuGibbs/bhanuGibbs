import { getAuthorizedHeaders } from './auth';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export const buildBackendQuotationPayload = (documentData) => {
  const referenceNumber = documentData?.quotation?.quotationNumber?.trim();
  const payload = {
    reference_number: referenceNumber || null,
    title: documentData?.documentType === 'billing' ? 'Billing' : 'Quotation',
    description: documentData?.quotation?.terms || null,
    issued_at: documentData?.quotation?.quotationDate || new Date().toISOString(),
    valid_until: documentData?.quotation?.validUntil || null,
    terms: documentData?.quotation?.terms || null,
    currency: documentData?.quotation?.currency || null,
    customer: {
      name: documentData?.customer?.name || '',
      email: documentData?.customer?.email || null,
      phone_number: documentData?.customer?.phone || documentData?.customer?.phone_number || null,
      address: documentData?.customer?.address || null,
      company_name: documentData?.customer?.companyName || null,
    },
    items: (documentData?.items || []).map((item) => ({
      product_name: item.itemName || 'Product',
      quantity: Number(item.quantity || 0),
      unit_price: Number(item.rate || 0),
    })),
  };

  return payload;
};

export const checkBackendHealth = async () => {
  const response = await fetch(`${API_BASE}/health`);
  if (!response.ok) {
    throw new Error('Backend is unavailable');
  }
  return response.json();
};

export const submitQuotationToBackend = async (documentData) => {
  const payload = buildBackendQuotationPayload(documentData);
  const response = await fetch(`${API_BASE}/quotations/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthorizedHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Unable to submit quotation to backend');
  }

  return response.json();
};

export const submitQuotationDraftToBackend = async (documentData) => {
  const payload = buildBackendQuotationPayload(documentData);
  const response = await fetch(`${API_BASE}/quotations/draft`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthorizedHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Unable to save quotation draft to backend');
  }

  return response.json();
};

export const finalizeQuotation = async (quotationId) => {
  const response = await fetch(`${API_BASE}/quotations/${quotationId}/finalize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthorizedHeaders(),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Unable to finalize quotation');
  }

  return response.json();
};

export const createCustomerIfMissing = async (customer) => {
  const payload = {
    name: customer.name || '',
    email: customer.email || null,
    phone_number: customer.phone || customer.phone_number || null,
    address: customer.address || null,
    company_name: customer.companyName || null,
  };

  const response = await fetch(`${API_BASE}/customers/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthorizedHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 201) {
    return await response.json();
  }

  if (response.status === 409) {
    // Customer already exists; that's fine — return null to indicate no new record
    return null;
  }

  // For other failures, throw an error so callers can decide what to do
  const text = await response.text();
  throw new Error(text || 'Unable to create customer');
};

export const getCustomers = async () => {
  const response = await fetch(`${API_BASE}/customers/`, {
    headers: {
      ...getAuthorizedHeaders(),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Unable to load customers');
  }

  return response.json();
};

export const createCustomer = async (payload) => {
  const response = await fetch(`${API_BASE}/customers/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthorizedHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Unable to create customer');
  }

  return response.json();
};

export const updateCustomer = async (customerId, payload) => {
  const response = await fetch(`${API_BASE}/customers/${customerId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthorizedHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Unable to update customer');
  }

  return response.json();
};

export const deleteCustomer = async (customerId) => {
  const response = await fetch(`${API_BASE}/customers/${customerId}`, {
    method: 'DELETE',
    headers: {
      ...getAuthorizedHeaders(),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Unable to delete customer');
  }

  return true;
};

export const getProducts = async () => {
  const response = await fetch(`${API_BASE}/products/`, {
    headers: {
      ...getAuthorizedHeaders(),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Unable to load products');
  }

  return response.json();
};

export const createProduct = async (payload) => {
  const response = await fetch(`${API_BASE}/products/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthorizedHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Unable to create product');
  }

  return response.json();
};

export const updateProduct = async (productId, payload) => {
  const response = await fetch(`${API_BASE}/products/${productId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthorizedHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Unable to update product');
  }

  return response.json();
};

export const deleteProduct = async (productId) => {
  const response = await fetch(`${API_BASE}/products/${productId}`, {
    method: 'DELETE',
    headers: {
      ...getAuthorizedHeaders(),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Unable to delete product');
  }

  return true;
};

export const getQuotations = async () => {
  const response = await fetch(`${API_BASE}/quotations/`, {
    headers: {
      ...getAuthorizedHeaders(),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Unable to load quotations');
  }

  return response.json();
};

export const deleteQuotation = async (quotationId) => {
  const response = await fetch(`${API_BASE}/quotations/${quotationId}`, {
    method: 'DELETE',
    headers: {
      ...getAuthorizedHeaders(),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Unable to delete quotation');
  }

  return true;
};
