import { authenticatedFetch, getAuthorizedHeaders } from './auth.js';
import { fetchApi, readApiError } from '../../utils/apiErrors.js';

const API_BASE = import.meta.env?.VITE_API_BASE || '/api';

// ---- Categories ----

export const getPOSCategories = async () => {
  const response = await authenticatedFetch(`${API_BASE}/pos/categories`);
  if (!response.ok) throw await readApiError(response, 'Unable to load categories.');
  return response.json();
};

export const createPOSCategory = async (data) => {
  const response = await authenticatedFetch(`${API_BASE}/pos/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthorizedHeaders() },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw await readApiError(response, 'Unable to create category.');
  return response.json();
};

export const updatePOSCategory = async (id, data) => {
  const response = await authenticatedFetch(`${API_BASE}/pos/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthorizedHeaders() },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw await readApiError(response, 'Unable to update category.');
  return response.json();
};

export const deletePOSCategory = async (id) => {
  const response = await authenticatedFetch(`${API_BASE}/pos/categories/${id}`, {
    method: 'DELETE',
    headers: getAuthorizedHeaders(),
  });
  if (!response.ok) throw await readApiError(response, 'Unable to delete category.');
};

// ---- Products ----

export const getPOSProducts = async (category_id, search) => {
  let url = `${API_BASE}/pos/products?`;
  if (category_id) url += `category_id=${category_id}&`;
  if (search) url += `search=${encodeURIComponent(search)}&`;
  const response = await authenticatedFetch(url);
  if (!response.ok) throw await readApiError(response, 'Unable to load products.');
  return response.json();
};

export const getPOSProduct = async (id) => {
  const response = await authenticatedFetch(`${API_BASE}/pos/products/${id}`);
  if (!response.ok) throw await readApiError(response, 'Product not found.');
  return response.json();
};

export const createPOSProduct = async (data) => {
  const response = await authenticatedFetch(`${API_BASE}/pos/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthorizedHeaders() },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw await readApiError(response, 'Unable to create product.');
  return response.json();
};

export const updatePOSProduct = async (id, data) => {
  const response = await authenticatedFetch(`${API_BASE}/pos/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthorizedHeaders() },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw await readApiError(response, 'Unable to update product.');
  return response.json();
};

export const deletePOSProduct = async (id) => {
  const response = await authenticatedFetch(`${API_BASE}/pos/products/${id}`, {
    method: 'DELETE',
    headers: getAuthorizedHeaders(),
  });
  if (!response.ok) throw await readApiError(response, 'Unable to delete product.');
};

export const lookupPOSProductByBarcode = async (barcode) => {
  const response = await authenticatedFetch(`${API_BASE}/pos/products/barcode/${encodeURIComponent(barcode)}`);
  if (!response.ok) throw await readApiError(response, 'Product not found.');
  return response.json();
};

export const generatePOSBarcode = async (id) => {
  const response = await authenticatedFetch(`${API_BASE}/pos/products/${id}/generate-barcode`, {
    method: 'POST',
    headers: getAuthorizedHeaders(),
  });
  if (!response.ok) throw await readApiError(response, 'Unable to generate barcode.');
  return response.json();
};

// ---- Variants ----

export const getPOSVariants = async (productId) => {
  const response = await authenticatedFetch(`${API_BASE}/pos/products/${productId}/variants`);
  if (!response.ok) throw await readApiError(response, 'Unable to load variants.');
  return response.json();
};

export const createPOSVariant = async (productId, data) => {
  const response = await authenticatedFetch(`${API_BASE}/pos/products/${productId}/variants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthorizedHeaders() },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw await readApiError(response, 'Unable to create variant.');
  return response.json();
};

export const updatePOSVariant = async (variantId, productId, data) => {
  const response = await authenticatedFetch(
    `${API_BASE}/pos/variants/${variantId}?product_id=${productId}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthorizedHeaders() },
      body: JSON.stringify(data),
    }
  );
  if (!response.ok) throw await readApiError(response, 'Unable to update variant.');
  return response.json();
};

export const deletePOSVariant = async (variantId, productId) => {
  const response = await authenticatedFetch(
    `${API_BASE}/pos/variants/${variantId}?product_id=${productId}`,
    { method: 'DELETE', headers: getAuthorizedHeaders() }
  );
  if (!response.ok) throw await readApiError(response, 'Unable to delete variant.');
};

// ---- Transactions ----

export const checkoutPOS = async (data) => {
  const response = await authenticatedFetch(`${API_BASE}/pos/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthorizedHeaders() },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw await readApiError(response, 'Checkout failed.');
  return response.json();
};

export const getPOSTransactions = async (start_date, end_date, status) => {
  let url = `${API_BASE}/pos/transactions?`;
  if (start_date) url += `start_date=${start_date}&`;
  if (end_date) url += `end_date=${end_date}&`;
  if (status) url += `status=${status}&`;
  const response = await authenticatedFetch(url);
  if (!response.ok) throw await readApiError(response, 'Unable to load transactions.');
  return response.json();
};

export const getPOSTransaction = async (id) => {
  const response = await authenticatedFetch(`${API_BASE}/pos/transactions/${id}`);
  if (!response.ok) throw await readApiError(response, 'Transaction not found.');
  return response.json();
};

export const cancelPOSTransaction = async (id) => {
  const response = await authenticatedFetch(`${API_BASE}/pos/transactions/${id}/cancel`, {
    method: 'POST',
    headers: getAuthorizedHeaders(),
  });
  if (!response.ok) throw await readApiError(response, 'Unable to cancel transaction.');
  return response.json();
};

// ---- Returns ----

export const createPOSReturn = async (data) => {
  const response = await authenticatedFetch(`${API_BASE}/pos/returns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthorizedHeaders() },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw await readApiError(response, 'Unable to create return.');
  return response.json();
};

export const getPOSReturns = async () => {
  const response = await authenticatedFetch(`${API_BASE}/pos/returns`);
  if (!response.ok) throw await readApiError(response, 'Unable to load returns.');
  return response.json();
};

// ---- Inventory ----

export const getPOSInventory = async () => {
  const response = await authenticatedFetch(`${API_BASE}/pos/inventory`);
  if (!response.ok) throw await readApiError(response, 'Unable to load inventory.');
  return response.json();
};

export const getPOSInventoryLowStock = async () => {
  const response = await authenticatedFetch(`${API_BASE}/pos/inventory/low-stock`);
  if (!response.ok) throw await readApiError(response, 'Unable to load low-stock products.');
  return response.json();
};

export const adjustPOSStock = async (data) => {
  const response = await authenticatedFetch(`${API_BASE}/pos/inventory/adjust`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthorizedHeaders() },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw await readApiError(response, 'Unable to adjust stock.');
  return response.json();
};

export const getPOSStockMovements = async (product_id, limit = 50) => {
  let url = `${API_BASE}/pos/stock-movements?limit=${limit}`;
  if (product_id) url += `&product_id=${product_id}`;
  const response = await authenticatedFetch(url);
  if (!response.ok) throw await readApiError(response, 'Unable to load stock movements.');
  return response.json();
};

// ---- Dashboard ----

export const getPOSDashboard = async () => {
  const response = await authenticatedFetch(`${API_BASE}/pos/dashboard`);
  if (!response.ok) throw await readApiError(response, 'Unable to load dashboard.');
  return response.json();
};
