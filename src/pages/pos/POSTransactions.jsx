import { useCallback, useEffect, useState } from 'react';
import { Ban, ExternalLink, X, Printer, Receipt } from 'lucide-react';
import Header from '../../components/Header';
import toast from 'react-hot-toast';
import { cancelPOSTransaction, getPOSTransaction, getPOSTransactions } from '../../integration/backend/posApi';

const formatMoney = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(Number(value) || 0);

const POSTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const result = await getPOSTransactions(startDate || null, endDate || null, null);
      setTransactions(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error('Failed to load transactions:', err);
      setError(err.message || 'Failed to load transactions. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCancel = async (id) => {
    if (!confirm('Cancel this transaction? Stock will be restored.')) return;
    try {
      await cancelPOSTransaction(id);
      toast.success('Transaction cancelled');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel');
    }
  };

  const handleViewDetail = async (tx) => {
    setDetailLoading(true);
    try {
      const result = await getPOSTransaction(tx.id);
      setDetail(result);
    } catch (err) {
      toast.error(err.message || 'Failed to load transaction details');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => setDetail(null);

  const handlePrintReceipt = (tx) => {
    const printWindow = window.open('', '_blank', 'width=320,height=600');
    if (!printWindow) return;
    const itemsHtml = (tx.items || []).map(item => `
      <tr>
        <td style="text-align:left;padding:4px 0;font-size:11px">${item.product_name}</td>
        <td style="text-align:center;font-size:11px">${item.quantity}</td>
        <td style="text-align:right;font-size:11px">${formatMoney(item.unit_price)}</td>
        <td style="text-align:right;font-size:11px;font-weight:bold">${formatMoney(item.line_total)}</td>
      </tr>
    `).join('');
    printWindow.document.write(`
      <html><head><title>Receipt ${tx.transaction_number}</title>
      <style>
        body{font-family:monospace;margin:0;padding:10px;width:280px;margin:auto}
        .center{text-align:center}
        table{width:100%;border-collapse:collapse;font-size:12px}
        th{text-align:left;border-bottom:1px dashed #000;padding:4px 0;font-size:11px}
        td{padding:4px 0;font-size:11px}
        .row{display:flex;justify-content:space-between;font-size:11px;padding:2px 0}
        .total{font-size:14px;font-weight:bold;border-top:1px dashed #000;padding-top:6px;margin-top:6px}
        .sep{border-top:1px dashed #000;margin:6px 0}
      </style></head><body>
      <div class="center"><strong>${tx.company_name || 'Your Company'}</strong><br/>
      ${tx.transaction_number}<br/>${new Date(tx.created_at).toLocaleString()}</div>
      <div class="sep"></div>
      <table><thead><tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th></tr></thead>
      <tbody>${itemsHtml}</tbody></table>
      <div class="sep"></div>
      <div class="row"><span>Subtotal:</span><span>${formatMoney(tx.subtotal)}</span></div>
      ${Number(tx.discount) > 0 ? `<div class="row"><span>Discount:</span><span>-${formatMoney(tx.discount)}</span></div>` : ''}
      ${Number(tx.tax_amount) > 0 ? `<div class="row"><span>Tax:</span><span>${formatMoney(tx.tax_amount)}</span></div>` : ''}
      <div class="row total"><span>Grand Total:</span><span>${formatMoney(tx.grand_total)}</span></div>
      <div class="row"><span>Payment:</span><span class="capitalize">${tx.payment_method}</span></div>
      <div class="row"><span>Amount Paid:</span><span>${formatMoney(tx.payment_amount)}</span></div>
      ${tx.notes ? `<div class="sep"></div><div style="font-size:11px">Notes: ${tx.notes}</div>` : ''}
      <div class="sep"></div>
      <div class="center" style="font-size:10px">Thank you for your purchase!</div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f8fa]">
        <Header />
        <div className="flex items-center justify-center py-32"><p className="text-slate-500">Loading transactions...</p></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <Header />
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Transactions</h1>
        {error && (
          <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
            {error}
          </div>
        )}
        <div className="flex gap-3 mb-4">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-500" />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-500" />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Receipt #</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Date</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Items</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Total</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Payment</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer" onClick={() => handleViewDetail(tx)}>
                  <td className="px-4 py-3 font-medium text-emerald-700 hover:underline">{tx.transaction_number}</td>
                  <td className="px-4 py-3 text-slate-600">{new Date(tx.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-600">{tx.items?.length || 0} item{tx.items?.length !== 1 ? 's' : ''}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-700">{formatMoney(tx.grand_total)}</td>
                  <td className="px-4 py-3 text-slate-600 capitalize">{tx.payment_method}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${tx.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleViewDetail(tx)} className="text-slate-400 hover:text-emerald-600" title="View details">
                        <ExternalLink className="h-4 w-4" />
                      </button>
                      {tx.status === 'completed' && (
                        <button onClick={() => handleCancel(tx.id)} className="text-slate-400 hover:text-rose-600" title="Cancel">
                          <Ban className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">No transactions found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Transaction Detail Modal */}
        {detail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={closeDetail}>
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Transaction Details</h2>
                  <p className="text-sm text-slate-500">{detail.transaction_number} • {new Date(detail.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handlePrintReceipt(detail)} className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50" title="Print receipt">
                    <Printer className="h-5 w-5" />
                  </button>
                  <button onClick={closeDetail} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {detailLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-slate-500">Loading details...</p>
                  </div>
                ) : (
                  <>
                    {/* Status & Payment Badge */}
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${detail.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {detail.status}
                      </span>
                      <span className="text-xs px-3 py-1.5 rounded-full font-medium bg-blue-100 text-blue-700 capitalize">
                        {detail.payment_method}
                      </span>
                    </div>

                    {/* Items Table */}
                    <div className="rounded-xl border border-slate-200 overflow-hidden mb-4">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="text-left px-4 py-3 font-medium text-slate-600">Product</th>
                            <th className="text-left px-4 py-3 font-medium text-slate-600">SKU</th>
                            <th className="text-center px-4 py-3 font-medium text-slate-600">Qty</th>
                            <th className="text-right px-4 py-3 font-medium text-slate-600">Unit Price</th>
                            <th className="text-right px-4 py-3 font-medium text-slate-600">Discount</th>
                            <th className="text-right px-4 py-3 font-medium text-slate-600">Tax</th>
                            <th className="text-right px-4 py-3 font-medium text-slate-600">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(detail.items || []).map((item, idx) => (
                            <tr key={idx} className="border-b border-slate-100 last:border-0">
                              <td className="px-4 py-3 font-medium text-slate-900">{item.product_name}</td>
                              <td className="px-4 py-3 text-slate-500 text-xs">{item.sku}</td>
                              <td className="px-4 py-3 text-center text-slate-600">{item.quantity}</td>
                              <td className="px-4 py-3 text-right text-slate-600">{formatMoney(item.unit_price)}</td>
                              <td className="px-4 py-3 text-right text-slate-500">{Number(item.discount) > 0 ? `-${formatMoney(item.discount)}` : '—'}</td>
                              <td className="px-4 py-3 text-right text-slate-500">{formatMoney(item.tax_amount)}</td>
                              <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatMoney(item.line_total)}</td>
                            </tr>
                          ))}
                          {(detail.items || []).length === 0 && (
                            <tr><td colSpan={7} className="text-center py-8 text-slate-400">No items</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Summary */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Subtotal</span>
                          <span className="text-slate-900">{formatMoney(detail.subtotal)}</span>
                        </div>
                        {Number(detail.discount) > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Discount</span>
                            <span className="text-rose-600">-{formatMoney(detail.discount)}</span>
                          </div>
                        )}
                        {Number(detail.tax_amount) > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Tax</span>
                            <span className="text-slate-900">{formatMoney(detail.tax_amount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-base font-bold border-t border-slate-200 pt-2 mt-2">
                          <span className="text-slate-900">Grand Total</span>
                          <span className="text-emerald-700">{formatMoney(detail.grand_total)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Amount Paid</span>
                          <span className="text-slate-900">{formatMoney(detail.payment_amount)}</span>
                        </div>
                        {detail.notes && (
                          <div className="pt-2 border-t border-slate-200">
                            <p className="text-xs text-slate-500">Notes: {detail.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
                <button onClick={() => handlePrintReceipt(detail)} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                  <Printer className="h-4 w-4" />
                  Print Receipt
                </button>
                <button onClick={closeDetail} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default POSTransactions;
