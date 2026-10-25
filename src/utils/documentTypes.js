export const isInvoiceDocument = (document) =>
  ['billing', 'invoice'].includes(String(document?.title || '').trim().toLowerCase());

export const getInvoicePaymentStatus = (document) => {
  const status = String(document?.status || '').trim().toLowerCase();
  if (status === 'paid') return 'Paid';
  if (['final', 'unpaid'].includes(status)) return 'Unpaid';
  return document?.status || 'Draft';
};
