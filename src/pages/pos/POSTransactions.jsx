import { useCallback, useEffect, useMemo, useState } from 'react';
import { Ban, ExternalLink, X, Printer } from 'lucide-react';
import Header from '../../components/Header';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/useAuth';
import { cancelPOSTransaction, getPOSTransaction, getPOSTransactions } from '../../integration/backend/posApi';

const formatMoney = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(Number(value) || 0);

const POSTransactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterByCashier, setFilterByCashier] = useState('');
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const isAdmin = user?.role === 'Admin' || user?.role === 'Super Admin';

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

  // Filtered transactions by cashier (Admin only feature)
  const filteredTransactions = useMemo(() => {
    if (!filterByCashier) return transactions;
    return transactions.filter((tx) => tx.created_by_id === filterByCashier);
  }, [transactions, filterByCashier]);

  // Extract unique cashiers from transactions (Admin only)
  const cashierList = useMemo(() => {
    const cashiers = new Map();
    transactions.forEach((tx) => {
      if (tx.created_by_id && tx.created_by_name) {
        cashiers.set(tx.created_by_id, tx.created_by_name);
      }
    });
    return Array.from(cashiers.entries());
  }, [transactions]);

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
      <div className="min-h-screen bg-[#F8F9FA]">
        <Header />
        <div className="flex items-center justify-center py-32"><p className="text-[#2D3748]/60">Loading transactions...</p></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-[#1E3A5F] mb-6">Transactions</h1>
        {error && (
          <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
            {error}
          </div>
        )}
        <div className="flex gap-3 mb-4">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-xl border border-[#1E3A5F]/10 bg-white px-4 py-2.5 text-sm text-[#1E3A5F] outline-none focus:border-[#FF6B35]" />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-xl border border-[#1E3A5F]/10 bg-white px-4 py-2.5 text-sm text-[#1E3A5F] outline-none focus:border-[#FF6B35]" />
        </div>
        {isAdmin && cashierList.length > 0 && (
          <div className="flex items-center gap-3 mb-4">
            <label className="text-sm font-medium text-[#1E3A5F]">Filter by cashier:</label>
            <select
              value={filterByCashier}
              onChange={(e) => setFilterByCashier(e.target.value)}
              className="min-h-10 rounded-xl border border-[#2D3748]/20 bg-white px-3 py-2 text-sm text-[#1E3A5F] outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/25"
            >
              <option value="">All cashiers ({transactions.length})</option>
              {cashierList.map(([cashierId, cashierName]) => {
                const count = transactions.filter(tx => tx.created_by_id === cashierId).length;
                return <option key={cashierId} value={cashierId}>{cashierName} ({count})</option>;
              })}
            </select>
            {filterByCashier && (
              <button
                type="button"
                onClick={() => setFilterByCashier('')}
                className="min-h-9 rounded-lg border border-rose-200 px-3 text-xs font-semibold text-rose-800 hover:bg-rose-50"
              >
                Clear filter
              </button>
            )}
            {filterByCashier && (
              <span className="text-sm text-[#2D3748]/60">
                Showing {filteredTransactions.length} of {transactions.length} transactions
              </span>
            )}
          </div>
        )}
        <div className="rounded-xl border border-[#1E3A5F]/10 bg-white overflow-hidden shadow-card-sm">
          <table className="w-full text-sm">
            <thead className="bg-[#1E3A5F]/5 border-b border-[#1E3A5F]/10">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-[#1E3A5F]">Receipt #</th>
                <th className="text-left px-4 py-3 font-medium text-[#1E3A5F]">Date</th>
                {isAdmin && <th className="text-left px-4 py-3 font-medium text-[#1E3A5F]">Cashier</th>}
                <th className="text-left px-4 py-3 font-medium text-[#1E3A5F]">Items</th>
                <th className="text-left px-4 py-3 font-medium text-[#1E3A5F]">Total</th>
                <th className="text-left px-4 py-3 font-medium text-[#1E3A5F]">Payment</th>
                <th className="text-left px-4 py-3 font-medium text-[#1E3A5F]">Status</th>
                <th className="text-left px-4 py-3 font-medium text-[#1E3A5F]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="border-b border-[#1E3A5F]/5 last:border-0 hover:bg-[#1E3A5F]/5 cursor-pointer" onClick={() => handleViewDetail(tx)}>
                  <td className="px-4 py-3 font-medium text-[#FF6B35] hover:underline">{tx.transaction_number}</td>
                  <td className="px-4 py-3 text-[#2D3748]">{new Date(tx.created_at).toLocaleString()}</td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      {tx.created_by_id ? (
                        <button
                          type="button"
                          onClick={() => setFilterByCashier(filterByCashier === tx.created_by_id ? '' : tx.created_by_id)}
                          className={`text-sm font-medium underline decoration-[#1E3A5F]/30 underline-offset-2 transition hover:text-[#FF6B35] ${filterByCashier === tx.created_by_id ? 'text-[#FF6B35]' : 'text-[#1E3A5F]'}`}
                          title={filterByCashier === tx.created_by_id ? 'Click to clear filter' : 'Click to filter by this cashier'}
                        >
                          {tx.created_by_name || 'Unknown'}
                        </button>
                      ) : (
                        <span className="text-[#2D3748]">—</span>
                      )}
                    </td>
                  )}
                  <td className="px-4 py-3 text-[#2D3748]">{tx.items?.length || 0} item{tx.items?.length !== 1 ? 's' : ''}</td>
                  <td className="px-4 py-3 font-semibold text-[#FF6B35]">{formatMoney(tx.grand_total)}</td>
                  <td className="px-4 py-3 text-[#2D3748] capitalize">{tx.payment_method}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${tx.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleViewDetail(tx)} className="text-[#2D3748]/40 hover:text-[#FF6B35]" title="View details">
                        <ExternalLink className="h-4 w-4" />
                      </button>
                      {tx.status === 'completed' && (
                        <button onClick={() => handleCancel(tx.id)} className="text-[#2D3748]/40 hover:text-rose-600" title="Cancel">
                          <Ban className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr><td colSpan={isAdmin ? 8 : 7} className="text-center py-12 text-[#2D3748]/40">
                  {transactions.length === 0 ? 'No transactions found' : 'No transactions from this cashier.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Transaction Detail Modal */}
        {detail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={closeDetail}>
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative bg-white rounded-xl shadow-card-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E3A5F]/10">
                <div>
                  <h2 className="text-lg font-bold text-[#1E3A5F]">Transaction Details</h2>
                  <p className="text-sm text-[#2D3748]/60">{detail.transaction_number} • {new Date(detail.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handlePrintReceipt(detail)} className="p-2 rounded-lg text-[#2D3748]/40 hover:text-[#FF6B35] hover:bg-orange-50" title="Print receipt">
                    <Printer className="h-5 w-5" />
                  </button>
                  <button onClick={closeDetail} className="p-2 rounded-lg text-[#2D3748]/40 hover:text-[#1E3A5F] hover:bg-[#1E3A5F]/5">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {detailLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-[#2D3748]/60">Loading details...</p>
                  </div>
                ) : (
                  <>
                    {/* Status & Payment Badge */}
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${detail.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>
                        {detail.status}
                      </span>
                      <span className="text-xs px-3 py-1.5 rounded-full font-medium bg-[#1E3A5F]/10 text-[#1E3A5F] capitalize">
                        {detail.payment_method}
                      </span>
                    </div>

                    {/* Items Table */}
                    <div className="rounded-xl border border-[#1E3A5F]/10 overflow-hidden mb-4">
                      <table className="w-full text-sm">
                        <thead className="bg-[#1E3A5F]/5 border-b border-[#1E3A5F]/10">
                          <tr>
                            <th className="text-left px-4 py-3 font-medium text-[#1E3A5F]">Product</th>
                            <th className="text-left px-4 py-3 font-medium text-[#1E3A5F]">SKU</th>
                            <th className="text-center px-4 py-3 font-medium text-[#1E3A5F]">Qty</th>
                            <th className="text-right px-4 py-3 font-medium text-[#1E3A5F]">Unit Price</th>
                            <th className="text-right px-4 py-3 font-medium text-[#1E3A5F]">Discount</th>
                            <th className="text-right px-4 py-3 font-medium text-[#1E3A5F]">Tax</th>
                            <th className="text-right px-4 py-3 font-medium text-[#1E3A5F]">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(detail.items || []).map((item, idx) => (
                            <tr key={idx} className="border-b border-[#1E3A5F]/5 last:border-0">
                              <td className="px-4 py-3 font-medium text-[#1E3A5F]">{item.product_name}</td>
                              <td className="px-4 py-3 text-[#2D3748]/60 text-xs">{item.sku}</td>
                              <td className="px-4 py-3 text-center text-[#2D3748]">{item.quantity}</td>
                              <td className="px-4 py-3 text-right text-[#2D3748]">{formatMoney(item.unit_price)}</td>
                              <td className="px-4 py-3 text-right text-[#2D3748]/60">{Number(item.discount) > 0 ? `-${formatMoney(item.discount)}` : '—'}</td>
                              <td className="px-4 py-3 text-right text-[#2D3748]/60">{formatMoney(item.tax_amount)}</td>
                              <td className="px-4 py-3 text-right font-semibold text-[#1E3A5F]">{formatMoney(item.line_total)}</td>
                            </tr>
                          ))}
                          {(detail.items || []).length === 0 && (
                            <tr><td colSpan={7} className="text-center py-8 text-[#2D3748]/40">No items</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Summary */}
                    <div className="rounded-xl border border-[#1E3A5F]/10 bg-[#1E3A5F]/5 p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#2D3748]">Subtotal</span>
                          <span className="text-[#1E3A5F]">{formatMoney(detail.subtotal)}</span>
                        </div>
                        {Number(detail.discount) > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-[#2D3748]">Discount</span>
                            <span className="text-rose-600">-{formatMoney(detail.discount)}</span>
                          </div>
                        )}
                        {Number(detail.tax_amount) > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-[#2D3748]">Tax</span>
                            <span className="text-[#1E3A5F]">{formatMoney(detail.tax_amount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-base font-bold border-t border-[#1E3A5F]/10 pt-2 mt-2">
                          <span className="text-[#1E3A5F]">Grand Total</span>
                          <span className="text-[#FF6B35]">{formatMoney(detail.grand_total)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#2D3748]">Amount Paid</span>
                          <span className="text-[#1E3A5F]">{formatMoney(detail.payment_amount)}</span>
                        </div>
                        {detail.notes && (
                          <div className="pt-2 border-t border-[#1E3A5F]/10">
                            <p className="text-xs text-[#2D3748]/60">Notes: {detail.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#1E3A5F]/10 bg-[#1E3A5F]/5">
                <button onClick={() => handlePrintReceipt(detail)} className="rounded-xl border border-[#1E3A5F]/10 bg-white px-4 py-2.5 text-sm font-semibold text-[#1E3A5F] hover:bg-[#1E3A5F]/5 flex items-center gap-2">
                  <Printer className="h-4 w-4" />
                  Print Receipt
                </button>
                <button onClick={closeDetail} className="rounded-xl bg-[#FF6B35] px-4 py-2.5 text-sm font-semibold text-white shadow-cta hover:bg-[#e55a28]">
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
