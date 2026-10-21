export const roundCurrency = (value) => {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return 0;
    return Math.round((amount + Math.sign(amount) * Number.EPSILON) * 100) / 100;
};

export const calculateLineAmounts = (item) => {
    const baseAmount = roundCurrency(Number(item.quantity || 0) * Number(item.rate || 0));
    const discount = roundCurrency((baseAmount * Number(item.discount || 0)) / 100);
    const taxableAmount = roundCurrency(baseAmount - discount);
    const gst = roundCurrency((taxableAmount * Number(item.gst || 0)) / 100);

    return {
        baseAmount,
        discount,
        taxableAmount,
        gst,
        amount: roundCurrency(taxableAmount + gst),
    };
};

export const calculateItemAmount = (item) => calculateLineAmounts(item).amount;

export const calculateSummary = (items = [], shipping = 0) => {
    const totals = items.reduce(
        (summary, item) => {
            const line = calculateLineAmounts(item);
            summary.subtotal = roundCurrency(summary.subtotal + line.baseAmount);
            summary.discount = roundCurrency(summary.discount + line.discount);
            summary.gstTotal = roundCurrency(summary.gstTotal + line.gst);
            return summary;
        },
        {subtotal: 0, discount: 0, gstTotal: 0},
    );
    const shippingTotal = roundCurrency(shipping || 0);
    const grandTotal = roundCurrency(totals.subtotal - totals.discount + totals.gstTotal + shippingTotal);

    return {
        ...totals,
        shipping: shippingTotal,
        grandTotal,
    };
};

export const normalizeDocumentTotals = (data) => ({
    ...data,
    summary: calculateSummary(data.items || [], data.shipping ?? data.summary?.shipping),
});
