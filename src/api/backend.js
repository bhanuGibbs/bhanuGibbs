const API_BASE = '/api';

export const buildBackendFormData = (documentData) => {
  return {
    reference_number: documentData?.quotation?.quotationNumber || 'Q-0001',

    title: ['billing', 'invoice'].includes(
        String(documentData?.documentType || '').trim().toLowerCase()) ? 'Invoice' : 'Quotation',

    description: documentData?.quotation?.terms || '',
    issued_at: documentData?.quotation?.quotationDate || new Date().toISOString(),
    customer: {
      name: documentData?.customer?.name || '',
      email: documentData?.customer?.email || null,
      phone_number: documentData?.customer?.phone || documentData?.customer?.phone_number || null,
      address: documentData?.customer?.address || null,
      company_name: documentData?.company?.name || null,
    },
    items: (documentData?.items || []).map((item) => ({
      product_name: item.itemName || 'Product',
      quantity: Number(item.quantity || 0),
      unit_price: Number(item.rate || 0),
    })),
  };
};

export const checkBackendHealth = async () => {
  const response = await fetch(`${API_BASE}/health`);
  if (!response.ok) {
    throw new Error('Backend is unavailable');
  }
  return response.json();
};

export const generateBackendPdf = async (documentData) => {
  const payload = buildBackendFormData(documentData);
  const response = await fetch(`${API_BASE}/quotations/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Unable to submit quotation to backend');
  }

  return response.json();
};
