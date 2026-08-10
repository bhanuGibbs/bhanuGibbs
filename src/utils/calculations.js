export const calculateItemAmount = (item) => {
  const baseAmount = Number(item.quantity || 0) * Number(item.rate || 0);
  const discountValue = (baseAmount * Number(item.discount || 0)) / 100;
  const discountedAmount = baseAmount - discountValue;
  const gstValue = (discountedAmount * Number(item.gst || 0)) / 100;
  return discountedAmount + gstValue;
};

export const calculateSummary = (items, shipping) => {
  const subtotal = items.reduce((sum, item) => {
    const baseAmount = Number(item.quantity || 0) * Number(item.rate || 0);
    return sum + baseAmount;
  }, 0);

  const discount = items.reduce((sum, item) => {
    const baseAmount = Number(item.quantity || 0) * Number(item.rate || 0);
    const discountValue = (baseAmount * Number(item.discount || 0)) / 100;
    return sum + discountValue;
  }, 0);

  const gstTotal = items.reduce((sum, item) => {
    const baseAmount = Number(item.quantity || 0) * Number(item.rate || 0);
    const discountValue = (baseAmount * Number(item.discount || 0)) / 100;
    const discountedAmount = baseAmount - discountValue;
    const gstValue = (discountedAmount * Number(item.gst || 0)) / 100;
    return sum + gstValue;
  }, 0);

  const grandTotal = subtotal - discount + gstTotal + Number(shipping || 0);

  return {
    subtotal: Number(subtotal.toFixed(2)),
    discount: Number(discount.toFixed(2)),
    gstTotal: Number(gstTotal.toFixed(2)),
    shipping: Number(Number(shipping || 0).toFixed(2)),
    grandTotal: Number(grandTotal.toFixed(2)),
  };
};
