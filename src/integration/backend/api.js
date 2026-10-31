import { authenticatedFetch, getAuthorizedHeaders } from './auth.js';
import { fetchApi, readApiError } from '../../utils/apiErrors.js';

const API_BASE = import.meta.env?.VITE_API_BASE || '/api';

export const buildBackendQuotationPayload = (documentData) => {
  const referenceNumber = documentData?.quotation?.quotationNumber?.trim();
  const isInvoice = ['billing', 'invoice'].includes(
    String(documentData?.documentType || '').trim().toLowerCase(),
  );
  const payload = {
    reference_number: referenceNumber || null,
    title: isInvoice ? 'Invoice' : 'Quotation',
    description: documentData?.quotation?.terms || null,
    issued_at: documentData?.quotation?.quotationDate || new Date().toISOString(),
    valid_until: documentData?.quotation?.validUntil || null,
    terms: documentData?.quotation?.terms || null,
    currency: documentData?.quotation?.currency || null,
    shipping_amount: Number(documentData?.shipping || 0),
    customer: {
      name: documentData?.customer?.name || '',
      email: documentData?.customer?.email || null,
      phone_number: documentData?.customer?.phone || documentData?.customer?.phone_number || null,
      address: documentData?.customer?.address || null,
      company_name: documentData?.customer?.companyName || null,
      gstin: documentData?.customer?.gstNumber || null,
      country: documentData?.customer?.country || null,
      state: documentData?.customer?.state || null,
      city: documentData?.customer?.city || null,
      pincode: documentData?.customer?.pincode || null,
    },
    items: (documentData?.items || []).map((item) => ({
      product_name: item.itemName || 'Product',
      product_id: item.catalogProductId || null,
      description: item.description || null,
      unit: item.unit || null,
      quantity: Number(item.quantity || 0),
      unit_price: Number(item.rate || 0),
      discount: Number(item.discount || 0),
      gst: Number(item.gst || 0),
      sku: item.sku || null,
      hsn_code: item.hsnCode || null,
    })),
  };

  return payload;
};

export const checkBackendHealth = async () => {
  const response = await fetchApi(`${API_BASE}/health`);
  if (!response.ok) {
    throw await readApiError(response, 'The server is unavailable. Please try again shortly.');
  }
  return response.json();
};

export const submitQuotationToBackend = async (documentData) => {
  const payload = buildBackendQuotationPayload(documentData);
  const response = await authenticatedFetch(`${API_BASE}/quotations/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthorizedHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await readApiError(response, 'Unable to submit quotation. Please try again.');
  }

  return response.json();
};

export const submitQuotationDraftToBackend = async (documentData) => {
  const payload = buildBackendQuotationPayload(documentData);
  const response = await authenticatedFetch(`${API_BASE}/quotations/draft`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthorizedHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await readApiError(response, 'Unable to save the quotation draft. Please try again.');
  }

  return response.json();
};

export const finalizeQuotation = async (quotationId) => {
  const response = await authenticatedFetch(`${API_BASE}/quotations/${quotationId}/finalize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthorizedHeaders(),
    },
  });

  if (!response.ok) {
    throw await readApiError(response, 'Unable to finalize the document. Please try again.');
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

  const response = await authenticatedFetch(`${API_BASE}/customers/`, {
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
  throw await readApiError(response, 'Unable to create customer. Please try again.');
};

export const getCustomers = async () => {
  const response = await authenticatedFetch(`${API_BASE}/customers/`, {
    headers: {
      ...getAuthorizedHeaders(),
    },
  });

  if (!response.ok) {
    throw await readApiError(response, 'Unable to load customers. Please try again.');
  }

  return response.json();
};

export const createCustomer = async (payload) => {
  const response = await authenticatedFetch(`${API_BASE}/customers/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthorizedHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await readApiError(response, 'Unable to create customer. Please try again.');
  }

  return response.json();
};

export const updateCustomer = async (customerId, payload) => {
  const response = await authenticatedFetch(`${API_BASE}/customers/${customerId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthorizedHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await readApiError(response, 'Unable to update customer. Please try again.');
  }

  return response.json();
};

export const deleteCustomer = async (customerId) => {
  const response = await authenticatedFetch(`${API_BASE}/customers/${customerId}`, {
    method: 'DELETE',
    headers: {
      ...getAuthorizedHeaders(),
    },
  });

  if (!response.ok) {
    throw await readApiError(response, 'Unable to delete customer. Please try again.');
  }

  return true;
};

export const getProducts = async () => {
  const response = await authenticatedFetch(`${API_BASE}/products/`, {
    headers: {
      ...getAuthorizedHeaders(),
    },
  });

  if (!response.ok) {
    throw await readApiError(response, 'Unable to load products. Please try again.');
  }

  return response.json();
};

export const createProduct = async (payload) => {
  const response = await authenticatedFetch(`${API_BASE}/products/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthorizedHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await readApiError(response, 'Unable to create product. Please try again.');
  }

  return response.json();
};

export const updateProduct = async (productId, payload) => {
  const response = await authenticatedFetch(`${API_BASE}/products/${productId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthorizedHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await readApiError(response, 'Unable to update product. Please try again.');
  }

  return response.json();
};

export const deleteProduct = async (productId) => {
  const response = await authenticatedFetch(`${API_BASE}/products/${productId}`, {
    method: 'DELETE',
    headers: {
      ...getAuthorizedHeaders(),
    },
  });

  if (!response.ok) {
    throw await readApiError(response, 'Unable to delete product. Please try again.');
  }

  return true;
};

export const getQuotations = async () => {
  const response = await authenticatedFetch(`${API_BASE}/quotations/`, {
    headers: {
      ...getAuthorizedHeaders(),
    },
  });

  if (!response.ok) {
    throw await readApiError(response, 'Unable to load documents. Please try again.');
  }

  return response.json();
};

export const getAdminUsers = async (companyId) => {
  const url = companyId
    ? `${API_BASE}/users/admin?company_id=${companyId}`
    : `${API_BASE}/users/admin`;
  const response = await authenticatedFetch(url, {
    headers: {
      ...getAuthorizedHeaders(),
    },
  });

  if (!response.ok) {
    throw await readApiError(response, 'Unable to load users. Please try again.');
  }

  return response.json();
};

export const getAllCompanies = async () => {
  const response = await authenticatedFetch(`${API_BASE}/companies/all`, {
    headers: {
      ...getAuthorizedHeaders(),
    },
  });

  if (!response.ok) {
    throw await readApiError(response, 'Unable to load companies. Please try again.');
  }

  return response.json();
};

export const updateUserPlan = async (userId, subscriptionPlan) => {
  const response = await authenticatedFetch(`${API_BASE}/users/${userId}/plan`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthorizedHeaders(),
    },
    body: JSON.stringify({ subscription_plan: subscriptionPlan }),
  });

  if (!response.ok) {
    throw await readApiError(response, 'Unable to update the user plan. Please try again.');
  }

  return response.json();
};

export const updateUserRole = async (userId, roleName) => {
  const response = await authenticatedFetch(`${API_BASE}/users/${userId}/role`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthorizedHeaders(),
    },
    body: JSON.stringify({ role_name: roleName }),
  });

  if (!response.ok) {
    throw await readApiError(response, 'Unable to update the user role. Please try again.');
  }

  return response.json();
};

export const deleteUser = async (userId) => {
  const response = await authenticatedFetch(`${API_BASE}/users/${userId}`, {
    method: 'DELETE',
    headers: {
      ...getAuthorizedHeaders(),
    },
  });

  if (!response.ok) {
    throw await readApiError(response, 'Unable to delete the user. Please try again.');
  }

  return true;
};

export const updateInvoicePaymentStatus = async (quotationId, paymentStatus) => {
  const response = await authenticatedFetch(`${API_BASE}/quotations/${quotationId}/payment-status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthorizedHeaders(),
    },
    body: JSON.stringify({status: paymentStatus}),
  });

  if (!response.ok) {
    throw await readApiError(response, 'Unable to update payment status. Please try again.');
  }

  return response.json();
};

export const deleteQuotation = async (quotationId) => {
  const response = await authenticatedFetch(`${API_BASE}/quotations/${quotationId}`, {
    method: 'DELETE',
    headers: {
      ...getAuthorizedHeaders(),
    },
  });

  if (!response.ok) {
    throw await readApiError(response, 'Unable to delete the document. Please try again.');
  }

  return true;
};

export const downloadQuotationPdf = async (quotationId, filename) => {
  const response = await authenticatedFetch(`${API_BASE}/quotations/${quotationId}/pdf`, {
    headers: {
      ...getAuthorizedHeaders(),
    },
  });

  if (!response.ok) {
    throw await readApiError(response, 'Unable to download the document. Please try again.');
  }

  const fileUrl = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = fileUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
};
