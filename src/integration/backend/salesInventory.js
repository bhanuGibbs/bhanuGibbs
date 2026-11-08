import { authenticatedFetch, getAuthorizedHeaders } from './auth.js';
import { readApiError } from '../../utils/apiErrors.js';

const API_BASE = import.meta.env?.VITE_API_BASE || '/api';
const BASE = `${API_BASE}/sales-inventory`;

const request = async (path, options = {}) => {
  const response = await authenticatedFetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...getAuthorizedHeaders(),
      ...options.headers,
    },
  });
  if (!response.ok) {
    throw await readApiError(response, 'Unable to complete the Sales & Inventory request.');
  }
  if (response.status === 204) return null;
  return response.json();
};

const json = (method, body) => ({ method, body: JSON.stringify(body) });

export const salesInventoryApi = {
  summary: () => request('/summary'),
  dealers: () => request('/dealers'),
  createDealer: (dealer) => request('/dealers', json('POST', dealer)),
  updateDealer: (id, dealer) => request(`/dealers/${id}`, json('PATCH', dealer)),
  products: () => request('/products'),
  createProduct: (product) => request('/products', json('POST', product)),
  updateProduct: (id, product) => request(`/products/${id}`, json('PATCH', product)),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),
  inventory: () => request('/inventory'),
  transactions: () => request('/inventory/transactions'),
  adjustInventory: (adjustment) => request('/inventory/adjustments', json('POST', adjustment)),
  orders: () => request('/orders'),
  createOrder: (order) => request('/orders', json('POST', order)),
  updateOrder: (id, order) => request(`/orders/${id}`, json('PATCH', order)),
  submitOrder: (id) => request(`/orders/${id}/submit`, json('POST', {})),
  approveOrder: (id) => request(`/orders/${id}/approve`, json('POST', {})),
  rejectOrder: (id, reason) => request(`/orders/${id}/reject`, json('POST', { reason })),
  updateOrderStatus: (id, status) => request(`/orders/${id}/status`, json('PATCH', { status })),
  salesReport: () => request('/reports/sales'),
  dealerSalesReport: () => request('/reports/dealer-sales'),
  repPerformanceReport: () => request('/reports/rep-performance'),
  monthlySalesReport: () => request('/reports/monthly-sales'),
  pendingOrdersReport: () => request('/reports/pending-orders'),
  inventoryMovementReport: () => request('/reports/inventory-movement'),
  lowStockReport: () => request('/reports/low-stock'),
  invoices: () => request('/invoices'),
  notifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, json('POST', {})),
  downloadSalesCsv: async (reportName = 'product-sales') => {
    const response = await authenticatedFetch(`${BASE}/reports/${reportName}.csv`, {
      headers: getAuthorizedHeaders(),
    });
    if (!response.ok) {
      throw await readApiError(response, 'Unable to export the sales report.');
    }
    return response.blob();
  },
  downloadInvoicePdf: async (id) => {
    const response = await authenticatedFetch(`${BASE}/invoices/${id}/pdf`, {
      headers: getAuthorizedHeaders(),
    });
    if (!response.ok) {
      throw await readApiError(response, 'Unable to download the invoice.');
    }
    return response.blob();
  },
};
