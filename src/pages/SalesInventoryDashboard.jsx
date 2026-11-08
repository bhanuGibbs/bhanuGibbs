import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownToLine,
  Bell,
  Boxes,
  Check,
  ClipboardList,
  FileBarChart2,
  LayoutDashboard,
  Package,
  Plus,
  RefreshCw,
  Store,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../context/useAuth';
import { salesInventoryApi } from '../integration/backend/salesInventory';

const sections = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'orders', label: 'Orders', icon: ClipboardList },
  { id: 'dealers', label: 'Dealers', icon: Store },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'inventory', label: 'Inventory', icon: Boxes },
  { id: 'reports', label: 'Reports', icon: FileBarChart2 },
];

const statusClass = {
  Draft: 'bg-slate-100 text-slate-700',
  'Pending Approval': 'bg-amber-100 text-amber-900',
  Approved: 'bg-emerald-100 text-emerald-800',
  Processing: 'bg-blue-100 text-blue-800',
  Dispatched: 'bg-indigo-100 text-indigo-800',
  Delivered: 'bg-slate-200 text-slate-800',
  Rejected: 'bg-rose-100 text-rose-800',
  Cancelled: 'bg-slate-100 text-slate-600',
};

const money = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
}).format(Number(value || 0));

const quantity = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? new Intl.NumberFormat('en-IN', { maximumFractionDigits: 3, useGrouping: false }).format(parsed)
    : value ?? '—';
};

const quantityWithUnit = (value, unit) => [quantity(value), unit].filter(Boolean).join(' ');

const Field = ({ label, value, onChange, type = 'text', required = false, hint, ...props }) => (
  <label className="block text-sm font-medium text-slate-700">
    {label}
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      required={required}
      className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base font-normal text-slate-950 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
      {...props}
    />
    {hint ? <span className="mt-1 block text-xs font-normal leading-5 text-slate-600">{hint}</span> : null}
  </label>
);

const Status = ({ value }) => (
  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[value] || statusClass.Draft}`}>
    {value}
  </span>
);

const ReportTable = ({ title, rows, columns, onExport, busy }) => (
  <section className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
    <div className="flex items-center justify-between gap-3 px-5 py-4">
      <h2 className="font-semibold text-slate-900">{title}</h2>
      <button type="button" onClick={onExport} disabled={busy} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
        <ArrowDownToLine size={14} /> CSV
      </button>
    </div>
    <table className="w-full min-w-[560px] text-left text-sm">
      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600"><tr>{columns.map(([key, label]) => <th key={key} className="px-4 py-3">{label}</th>)}</tr></thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map((row, index) => <tr key={row.id || row.order_id || (row.product_id && row.transaction_type ? `${row.product_id}-${row.transaction_type}` : null) || row.product_id || row.dealer_id || row.sales_rep_id || row.month || index}>
          {columns.map(([key]) => <td key={key} className="px-4 py-3 text-slate-700">{key === 'sales_total' || key === 'total_amount' ? money(row[key]) : ['quantity', 'reorder_level', 'net_quantity'].includes(key) ? quantityWithUnit(row[key], row.unit) : row[key] ?? '—'}</td>)}
        </tr>)}
        {!rows.length ? <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-slate-600">No matching records.</td></tr> : null}
      </tbody>
    </table>
  </section>
);

const SalesInventoryDashboard = () => {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const [section, setSection] = useState('overview');
  const [data, setData] = useState({
    summary: null,
    orders: [],
    dealers: [],
    products: [],
    inventory: [],
    transactions: [],
    report: null,
    notifications: [],
    reports: {
      dealerSales: [],
      repPerformance: [],
      monthlySales: [],
      pendingOrders: [],
      inventoryMovement: [],
      lowStock: [],
    },
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [dealerForm, setDealerForm] = useState({ name: '', dealer_code: '', contact_name: '', phone_number: '', email: '', territory: '' });
  const [productForm, setProductForm] = useState({ product_code: '', name: '', category: '', unit: '', unit_price: '', reorder_level: '0', opening_stock: '0' });
  const [stockForm, setStockForm] = useState({ product_id: '', quantity_delta: '', transaction_type: 'Purchase', reason: '' });
  const [orderForm, setOrderForm] = useState({ dealer_id: '', product_id: '', quantity: '1', notes: '' });
  const [editingOrder, setEditingOrder] = useState(null);
  const [editOrderForm, setEditOrderForm] = useState({ dealer_id: '', notes: '', items: [] });

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [
        summary,
        orders,
        dealers,
        products,
        inventory,
        report,
        notifications,
        dealerSales,
        repPerformance,
        monthlySales,
        lowStock,
        pendingOrders,
        inventoryMovement,
      ] = await Promise.all([
        salesInventoryApi.summary(),
        salesInventoryApi.orders(),
        salesInventoryApi.dealers(),
        salesInventoryApi.products(),
        salesInventoryApi.inventory(),
        salesInventoryApi.salesReport(),
        salesInventoryApi.notifications(),
        salesInventoryApi.dealerSalesReport(),
        salesInventoryApi.repPerformanceReport(),
        salesInventoryApi.monthlySalesReport(),
        salesInventoryApi.lowStockReport(),
        isAdmin ? salesInventoryApi.pendingOrdersReport() : Promise.resolve([]),
        isAdmin ? salesInventoryApi.inventoryMovementReport() : Promise.resolve([]),
      ]);
      let transactions = [];
      if (isAdmin) transactions = await salesInventoryApi.transactions();
      setData({
        summary,
        orders,
        dealers,
        products,
        inventory,
        transactions,
        report,
        notifications,
        reports: { dealerSales, repPerformance, monthlySales, pendingOrders, inventoryMovement, lowStock },
      });
    } catch (requestError) {
      setError(requestError.message || 'Workspace data could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const runAction = async (action, successMessage) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await action();
      setNotice(successMessage);
      await refresh();
    } catch (requestError) {
      setError(requestError.message || 'The action could not be completed.');
    } finally {
      setBusy(false);
    }
  };

  const pendingCount = data.summary?.orders_by_status?.['Pending Approval'] || 0;
  const unreadCount = data.notifications.filter((item) => !item.is_read).length;
  const activeProducts = useMemo(() => data.products.filter((item) => item.is_active), [data.products]);

  const createDealer = (event) => {
    event.preventDefault();
    runAction(async () => {
      await salesInventoryApi.createDealer(dealerForm);
      setDealerForm({ name: '', dealer_code: '', contact_name: '', phone_number: '', email: '', territory: '' });
    }, 'Dealer added to your organization.');
  };

  const createProduct = (event) => {
    event.preventDefault();
    runAction(async () => {
      await salesInventoryApi.createProduct({
        ...productForm,
        unit_price: Number(productForm.unit_price),
        reorder_level: Number(productForm.reorder_level || 0),
        opening_stock: Number(productForm.opening_stock || 0),
      });
      setProductForm({ product_code: '', name: '', category: '', unit: '', unit_price: '', reorder_level: '0', opening_stock: '0' });
    }, Number(productForm.opening_stock) > 0
      ? 'Product and opening stock added to inventory.'
      : 'Product added. Add stock anytime from Inventory.');
  };

  const deleteProduct = (product) => {
    const confirmed = window.confirm(
      `Remove ${product.name} from the active product catalog? Historical orders, stock, and transaction records will be retained.`,
    );
    if (!confirmed) return;
    runAction(
      () => salesInventoryApi.deleteProduct(product.id),
      `${product.name} removed from the active catalog. Historical records were retained.`,
    );
  };

  const createOrder = (event) => {
    event.preventDefault();
    runAction(async () => {
      await salesInventoryApi.createOrder({
        dealer_id: orderForm.dealer_id,
        items: [{ product_id: orderForm.product_id, quantity: Number(orderForm.quantity) }],
        notes: orderForm.notes || undefined,
        submit: true,
      });
      setOrderForm({ dealer_id: '', product_id: '', quantity: '1', notes: '' });
    }, 'Order submitted for Admin approval. Stock has not been changed.');
  };

  const startOrderEdit = (order) => {
    setEditingOrder(order.id);
    setEditOrderForm({
      dealer_id: order.dealer_id,
      notes: order.notes || '',
      items: order.items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
      })),
    });
  };

  const saveOrderEdit = (event, order) => {
    event.preventDefault();
    runAction(async () => {
      await salesInventoryApi.updateOrder(order.id, {
        dealer_id: editOrderForm.dealer_id,
        notes: editOrderForm.notes,
        items: editOrderForm.items,
      });
      setEditingOrder(null);
    }, 'Order changes saved. Review and submit it when ready.');
  };

  const adjustStock = (event) => {
    event.preventDefault();
    runAction(async () => {
      await salesInventoryApi.adjustInventory({
        ...stockForm,
        quantity_delta: Number(stockForm.quantity_delta),
      });
      setStockForm({ product_id: '', quantity_delta: '', transaction_type: 'Purchase', reason: '' });
    }, 'Inventory transaction recorded.');
  };

  const downloadReport = async (reportName = 'product-sales') => {
    setBusy(true);
    setError('');
    try {
      const blob = await salesInventoryApi.downloadSalesCsv(reportName);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportName}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(requestError.message || 'Unable to export the report.');
    } finally {
      setBusy(false);
    }
  };

  const downloadInvoice = async (invoice) => {
    setBusy(true);
    setError('');
    try {
      const blob = await salesInventoryApi.downloadInvoicePdf(invoice.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoice.invoice_number}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(requestError.message || 'Unable to download the invoice.');
    } finally {
      setBusy(false);
    }
  };

  const updateOrder = (order, action) => {
    if (action === 'approve') {
      runAction(() => salesInventoryApi.approveOrder(order.id), 'Order approved and stock deducted.');
    } else if (action === 'reject') {
      const reason = window.prompt(`Why are you rejecting ${order.order_number}?`);
      if (reason?.trim()) runAction(() => salesInventoryApi.rejectOrder(order.id, reason), 'Order rejected. No stock was changed.');
    } else if (action === 'submit') {
      runAction(() => salesInventoryApi.submitOrder(order.id), 'Order submitted for approval.');
    } else {
      runAction(() => salesInventoryApi.updateOrderStatus(order.id, action), `Order marked ${action.toLowerCase()}.`);
    }
  };

  const markRead = (notification) => {
    runAction(() => salesInventoryApi.markNotificationRead(notification.id), 'Notification marked as read.');
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <Header user={user} onLogout={logout} />
      <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Sales & Inventory</h1>
            <p className="mt-2 text-sm text-slate-600">{user?.company_name || 'Organization workspace'} · {isAdmin ? 'Admin' : 'Sales'}</p>
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 sm:self-auto"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
            Refresh
          </button>
        </div>

        <nav className="mt-7 flex gap-1 overflow-x-auto border-b border-slate-200" aria-label="Sales and inventory sections">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setSection(id)}
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-semibold transition ${
                section === id ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-600 hover:text-slate-950'
              }`}
              aria-current={section === id ? 'page' : undefined}
            >
              <Icon size={16} aria-hidden="true" />
              {label}
              {id === 'orders' && pendingCount > 0 && isAdmin ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900">{pendingCount}</span>
              ) : null}
            </button>
          ))}
        </nav>

        {error ? <p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p> : null}
        {notice ? <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{notice}</p> : null}
        {loading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Loading workspace">
            {[1, 2, 3, 4].map((item) => <div key={item} className="h-28 animate-pulse rounded-lg bg-slate-200" />)}
          </div>
        ) : null}

        {!loading && section === 'overview' ? (
          <section className="mt-6 space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ['Orders', Object.values(data.summary?.orders_by_status || {}).reduce((sum, value) => sum + value, 0), 'All order statuses'],
                ['Awaiting approval', pendingCount, 'Orders need an Admin decision'],
                ['Approved sales', money(data.summary?.sales_total), 'Approved and fulfilled orders'],
                ['Active dealers', data.summary?.dealer_count || 0, 'In this organization'],
              ].map(([label, value, detail]) => (
                <div key={label} className="rounded-lg border border-slate-200 bg-white p-5">
                  <p className="text-sm font-medium text-slate-600">{label}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
                  <p className="mt-1 text-xs text-slate-500">{detail}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)]">
              <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <h2 className="font-semibold text-slate-900">Recent orders</h2>
                  <button type="button" onClick={() => setSection('orders')} className="text-sm font-semibold text-emerald-800 hover:underline">View orders</button>
                </div>
                {data.summary?.recent_orders?.length ? (
                  <div className="divide-y divide-slate-100">
                    {data.summary.recent_orders.map((order) => (
                      <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{order.order_number} · {order.dealer_name}</p>
                          <p className="mt-1 text-xs text-slate-500">{order.sales_rep_name} · {new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-slate-800">{money(order.total_amount)}</span>
                          <Status value={order.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="px-5 py-8 text-sm text-slate-600">No orders yet. Create an order after adding a dealer and products.</p>}
              </section>

              <div className="space-y-6">
                <section className="rounded-lg border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-slate-900">Low stock</h2>
                    <button type="button" onClick={() => setSection('inventory')} className="text-sm font-semibold text-emerald-800 hover:underline">Manage</button>
                  </div>
                  {data.summary?.low_stock?.length ? (
                    <ul className="mt-4 divide-y divide-slate-100">
                      {data.summary.low_stock.slice(0, 5).map((item) => (
                        <li key={item.id} className="flex justify-between gap-3 py-3 text-sm">
                          <span className="font-medium text-slate-800">{item.name}</span>
                          <span className="shrink-0 text-amber-800">{item.quantity} / {item.reorder_level} {item.unit}</span>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="mt-4 text-sm text-slate-600">No products are below their reorder level.</p>}
                </section>
                <section className="rounded-lg border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-semibold text-slate-900">Notifications</h2>
                    <span className="text-xs text-slate-500">{unreadCount} unread</span>
                  </div>
                  {data.notifications.length ? (
                    <ul className="mt-3 space-y-2">
                      {data.notifications.slice(0, 4).map((item) => (
                        <li key={item.id} className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 p-3">
                          <span className="text-sm leading-5 text-slate-700">{item.message}</span>
                          {!item.is_read ? <button type="button" onClick={() => markRead(item)} aria-label="Mark notification read" className="rounded-lg p-1 text-emerald-800 hover:bg-emerald-100"><Check size={16} /></button> : null}
                        </li>
                      ))}
                    </ul>
                  ) : <p className="mt-4 text-sm text-slate-600"><Bell size={15} className="mr-1 inline" />You're up to date.</p>}
                </section>
              </div>
            </div>
          </section>
        ) : null}

        {!loading && section === 'orders' ? (
          <section className="mt-6 space-y-5">
            <details className="group rounded-lg border border-slate-200 bg-white">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-semibold text-slate-900">
                <span className="inline-flex items-center gap-2"><Plus size={17} /> Create an order</span>
                <span className="text-sm font-medium text-slate-500 group-open:hidden">Open form</span>
                <span className="text-sm font-medium text-slate-500 group-[&:not([open])]:hidden">Close form</span>
              </summary>
              <form onSubmit={createOrder} className="grid gap-4 border-t border-slate-100 p-5 sm:grid-cols-2 xl:grid-cols-4">
                <label className="block text-sm font-medium text-slate-700">
                  Dealer
                  <select required value={orderForm.dealer_id} onChange={(event) => setOrderForm({ ...orderForm, dealer_id: event.target.value })} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-base font-normal text-slate-950 focus:border-emerald-700 focus:outline-none">
                    <option value="">Select dealer</option>
                    {data.dealers.filter((dealer) => dealer.is_active).map((dealer) => <option key={dealer.id} value={dealer.id}>{dealer.name}</option>)}
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Product
                  <select required value={orderForm.product_id} onChange={(event) => setOrderForm({ ...orderForm, product_id: event.target.value })} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-base font-normal text-slate-950 focus:border-emerald-700 focus:outline-none">
                    <option value="">Select product</option>
                    {activeProducts.map((product) => <option key={product.id} value={product.id}>{product.name} · {money(product.unit_price)} / {product.unit}</option>)}
                  </select>
                </label>
                <Field label="Quantity" type="number" min="0.001" step="0.001" required value={orderForm.quantity} onChange={(quantity) => setOrderForm({ ...orderForm, quantity })} hint={activeProducts.find((product) => product.id === orderForm.product_id)?.unit ? `Measured in ${activeProducts.find((product) => product.id === orderForm.product_id).unit}.` : 'Select a product to see its unit.'} />
                <Field label="Order notes" value={orderForm.notes} onChange={(notes) => setOrderForm({ ...orderForm, notes })} />
                <div className="sm:col-span-2 xl:col-span-4">
                  <button disabled={busy || !data.dealers.length || !activeProducts.length} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">
                    <Plus size={16} /> {busy ? 'Submitting…' : 'Submit for approval'}
                  </button>
                  <p className="mt-2 text-xs text-slate-600">Submitting an order does not reduce inventory. Stock changes only after Admin approval.</p>
                </div>
              </form>
            </details>
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600"><tr><th className="px-4 py-3">Order / dealer</th><th className="px-4 py-3">Sales rep</th><th className="px-4 py-3">Items</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Action</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {data.orders.map((order) => (
                    <Fragment key={order.id}>
                    <tr className="align-top">
                      <td className="px-4 py-4"><p className="font-semibold text-slate-900">{order.order_number}</p><p className="mt-1 text-slate-600">{order.dealer_name}</p><p className="mt-1 text-xs text-slate-500">{new Date(order.created_at).toLocaleDateString()}</p></td>
                      <td className="px-4 py-4 text-slate-700">{order.sales_rep_name}</td>
                      <td className="px-4 py-4 text-slate-700">{order.items.map((item) => `${item.product_name} × ${quantityWithUnit(item.quantity, item.unit)}`).join(', ')}</td>
                      <td className="px-4 py-4 font-semibold text-slate-900">{money(order.total_amount)}</td>
                      <td className="px-4 py-4"><Status value={order.status} />{order.rejection_reason ? <p className="mt-2 max-w-48 text-xs text-rose-800">{order.rejection_reason}</p> : null}{order.history?.length ? <details className="mt-2"><summary className="cursor-pointer text-xs font-medium text-slate-600">History ({order.history.length})</summary><ol className="mt-2 space-y-1 text-xs text-slate-600">{order.history.map((entry, index) => <li key={`${entry.to_status}-${index}`}>{entry.from_status ? `${entry.from_status} → ` : ''}{entry.to_status}{entry.note ? ` · ${entry.note}` : ''}</li>)}</ol></details> : null}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          {['Draft', 'Rejected'].includes(order.status) && (isAdmin || order.sales_rep_id === user?.id) ? <button type="button" disabled={busy} onClick={() => startOrderEdit(order)} className="min-h-9 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50">Edit</button> : null}
                          {isAdmin && order.status === 'Pending Approval' ? <>
                            <button type="button" disabled={busy} onClick={() => updateOrder(order, 'approve')} className="min-h-9 rounded-lg bg-emerald-700 px-3 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">Approve</button>
                            <button type="button" disabled={busy} onClick={() => updateOrder(order, 'reject')} className="min-h-9 rounded-lg border border-rose-200 px-3 text-xs font-semibold text-rose-800 hover:bg-rose-50 disabled:opacity-60">Reject</button>
                          </> : null}
                          {order.status === 'Draft' && (isAdmin || order.sales_rep_id === user?.id) ? <button type="button" disabled={busy} onClick={() => updateOrder(order, 'submit')} className="min-h-9 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50">Submit</button> : null}
                          {['Draft', 'Pending Approval'].includes(order.status) && (isAdmin || order.sales_rep_id === user?.id) ? <button type="button" disabled={busy} onClick={() => updateOrder(order, 'Cancelled')} className="min-h-9 rounded-lg border border-rose-200 px-3 text-xs font-semibold text-rose-800 hover:bg-rose-50">Cancel</button> : null}
                          {isAdmin && order.status === 'Approved' ? <button type="button" disabled={busy} onClick={() => updateOrder(order, 'Processing')} className="min-h-9 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50">Start processing</button> : null}
                          {isAdmin && order.status === 'Processing' ? <button type="button" disabled={busy} onClick={() => updateOrder(order, 'Dispatched')} className="min-h-9 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50">Dispatch</button> : null}
                          {isAdmin && order.status === 'Dispatched' ? <button type="button" disabled={busy} onClick={() => updateOrder(order, 'Delivered')} className="min-h-9 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50">Mark delivered</button> : null}
                          {order.invoice ? <button type="button" disabled={busy} onClick={() => downloadInvoice(order.invoice)} className="min-h-9 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"><ArrowDownToLine size={13} className="mr-1 inline" />{order.invoice.invoice_number}</button> : null}
                        </div>
                      </td>
                    </tr>
                    {editingOrder === order.id ? <tr><td colSpan="6" className="border-t border-slate-100 bg-slate-50/70 px-4 py-4">
                      <form onSubmit={(event) => saveOrderEdit(event, order)} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <label className="block text-sm font-medium text-slate-700">Dealer<select required value={editOrderForm.dealer_id} onChange={(event) => setEditOrderForm({ ...editOrderForm, dealer_id: event.target.value })} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-base font-normal text-slate-950 focus:border-emerald-700 focus:outline-none">{data.dealers.filter((dealer) => dealer.is_active).map((dealer) => <option key={dealer.id} value={dealer.id}>{dealer.name}</option>)}</select></label>
                        <Field label="Order notes" value={editOrderForm.notes} onChange={(notes) => setEditOrderForm({ ...editOrderForm, notes })} />
                        <div className="space-y-3 sm:col-span-2 lg:col-span-4">
                          {editOrderForm.items.map((item, index) => <div key={`${editingOrder}-${index}`} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px_auto]">
                            <label className="block text-sm font-medium text-slate-700">Product<select required value={item.product_id} onChange={(event) => setEditOrderForm({ ...editOrderForm, items: editOrderForm.items.map((line, lineIndex) => lineIndex === index ? { ...line, product_id: event.target.value } : line) })} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-base font-normal text-slate-950 focus:border-emerald-700 focus:outline-none">{activeProducts.map((product) => <option key={product.id} value={product.id}>{product.name} · {money(product.unit_price)} / {product.unit}</option>)}</select></label>
                            <Field label="Quantity" type="number" min="0.001" step="0.001" required value={item.quantity} onChange={(quantity) => setEditOrderForm({ ...editOrderForm, items: editOrderForm.items.map((line, lineIndex) => lineIndex === index ? { ...line, quantity } : line) })} hint={activeProducts.find((product) => product.id === item.product_id)?.unit ? `Measured in ${activeProducts.find((product) => product.id === item.product_id).unit}.` : 'Select a product to see its unit.'} />
                            <button type="button" disabled={editOrderForm.items.length === 1} onClick={() => setEditOrderForm({ ...editOrderForm, items: editOrderForm.items.filter((_, lineIndex) => lineIndex !== index) })} aria-label="Remove item" className="mt-6 min-h-11 rounded-xl border border-rose-200 px-3 text-rose-800 disabled:opacity-40"><X size={16} /></button>
                          </div>)}
                          <button type="button" onClick={() => setEditOrderForm({ ...editOrderForm, items: [...editOrderForm.items, { product_id: activeProducts[0]?.id || '', quantity: '1' }] })} disabled={!activeProducts.length} className="min-h-9 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-white disabled:opacity-50">Add item</button>
                        </div>
                        <div className="flex gap-2 sm:col-span-2 lg:col-span-4"><button type="submit" disabled={busy} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"><Check size={15} />Save changes</button><button type="button" onClick={() => setEditingOrder(null)} className="min-h-10 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700">Close</button></div>
                      </form>
                    </td></tr> : null}
                    </Fragment>
                  ))}
                  {!data.orders.length ? <tr><td colSpan="6" className="px-4 py-10 text-center text-slate-600">No orders yet. Use “Create an order” to submit the first one.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {!loading && section === 'dealers' ? (
          <section className="mt-6 space-y-5">
            <details className="group rounded-lg border border-slate-200 bg-white">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between px-5 py-4 font-semibold text-slate-900"><span className="inline-flex items-center gap-2"><Plus size={17} /> Add dealer</span><span className="text-sm font-medium text-slate-500">Open form</span></summary>
              <form onSubmit={createDealer} className="grid gap-4 border-t border-slate-100 p-5 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Dealer name" required value={dealerForm.name} onChange={(name) => setDealerForm({ ...dealerForm, name })} />
                <Field label="Dealer code" value={dealerForm.dealer_code} onChange={(dealer_code) => setDealerForm({ ...dealerForm, dealer_code })} />
                <Field label="Contact name" value={dealerForm.contact_name} onChange={(contact_name) => setDealerForm({ ...dealerForm, contact_name })} />
                <Field label="Phone" type="tel" value={dealerForm.phone_number} onChange={(phone_number) => setDealerForm({ ...dealerForm, phone_number })} />
                <Field label="Email" type="email" value={dealerForm.email} onChange={(email) => setDealerForm({ ...dealerForm, email })} />
                <Field label="Territory" value={dealerForm.territory} onChange={(territory) => setDealerForm({ ...dealerForm, territory })} />
                <button disabled={busy} className="min-h-11 self-end rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">Save dealer</button>
              </form>
            </details>
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600"><tr><th className="px-4 py-3">Dealer</th><th className="px-4 py-3">Code</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Territory</th><th className="px-4 py-3">Status</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {data.dealers.map((dealer) => <tr key={dealer.id}><td className="px-4 py-4 font-semibold text-slate-900">{dealer.name}</td><td className="px-4 py-4 text-slate-700">{dealer.dealer_code || '—'}</td><td className="px-4 py-4 text-slate-700">{dealer.contact_name || dealer.phone_number || dealer.email || '—'}</td><td className="px-4 py-4 text-slate-700">{dealer.territory || '—'}</td><td className="px-4 py-4"><span className={`text-xs font-semibold ${dealer.is_active ? 'text-emerald-800' : 'text-slate-500'}`}>{dealer.is_active ? 'Active' : 'Inactive'}</span></td></tr>)}
                  {!data.dealers.length ? <tr><td colSpan="5" className="px-4 py-10 text-center text-slate-600">No dealers yet. Add a dealer to start recording orders.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {!loading && section === 'products' ? (
          <section className="mt-6 space-y-5">
            {isAdmin ? <details className="group rounded-lg border border-slate-200 bg-white">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between px-5 py-4 font-semibold text-slate-900"><span className="inline-flex items-center gap-2"><Plus size={17} /> Add product</span><span className="text-sm font-medium text-slate-500">Open form</span></summary>
              <form onSubmit={createProduct} className="grid gap-4 border-t border-slate-100 p-5 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Product code" required value={productForm.product_code} onChange={(product_code) => setProductForm({ ...productForm, product_code })} />
                <Field label="Product name" required value={productForm.name} onChange={(name) => setProductForm({ ...productForm, name })} />
                <Field label="Category" value={productForm.category} onChange={(category) => setProductForm({ ...productForm, category })} />
                <Field label="Stock unit" required value={productForm.unit} onChange={(unit) => setProductForm({ ...productForm, unit })} placeholder="e.g. bag, packet, kg" hint="Name the unit used for stock, orders, and reorder levels." />
                <Field label="Unit price" type="number" min="0" step="0.01" required value={productForm.unit_price} onChange={(unit_price) => setProductForm({ ...productForm, unit_price })} />
                <Field label="Low-stock threshold" type="number" min="0" step="0.001" value={productForm.reorder_level} onChange={(reorder_level) => setProductForm({ ...productForm, reorder_level })} />
                <Field label="Opening stock (optional)" type="number" min="0" step="0.001" value={productForm.opening_stock} onChange={(opening_stock) => setProductForm({ ...productForm, opening_stock })} hint="If entered, this is added to inventory and recorded as a purchase." />
                <button disabled={busy} className="min-h-11 self-end rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">Save product</button>
              </form>
            </details> : <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">Product setup is managed by your organization Admin.</p>}
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600"><tr><th scope="col" className="px-4 py-3">Product</th><th scope="col" className="px-4 py-3">Category</th><th scope="col" className="px-4 py-3">Units</th><th scope="col" className="px-4 py-3">Price / unit</th><th scope="col" className="px-4 py-3">Available</th><th scope="col" className="px-4 py-3">Reorder at</th>{isAdmin ? <th scope="col" className="px-4 py-3">Actions</th> : null}</tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {data.products.map((product) => <tr key={product.id}><td className="px-4 py-4"><p className="font-semibold text-slate-900">{product.name}</p><p className="mt-1 text-xs text-slate-500">{product.product_code}{!product.is_active ? ' · Inactive' : ''}</p></td><td className="px-4 py-4 text-slate-700">{product.category || '—'}</td><td className="px-4 py-4 font-medium text-slate-900">{product.unit}</td><td className="px-4 py-4 text-slate-800">{money(product.unit_price)}</td><td className="px-4 py-4 font-semibold tabular-nums text-slate-900">{quantityWithUnit(product.quantity, product.unit)}</td><td className="px-4 py-4 tabular-nums text-slate-700">{quantityWithUnit(product.reorder_level, product.unit)}</td>{isAdmin ? <td className="px-4 py-4">{product.is_active ? <button type="button" disabled={busy} onClick={() => deleteProduct(product)} aria-label={`Delete ${product.name}`} title="Remove from active catalog" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-rose-200 px-3 text-xs font-semibold text-rose-800 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 disabled:cursor-not-allowed disabled:opacity-60"><Trash2 size={15} /> Delete</button> : <span className="text-xs font-medium text-slate-500">Inactive</span>}</td> : null}</tr>)}
                  {!data.products.length ? <tr><td colSpan={isAdmin ? 7 : 6} className="px-4 py-10 text-center text-slate-600">No products yet. Add your first product to build the catalog.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {!loading && section === 'inventory' ? (
          <section className="mt-6 space-y-5">
            {isAdmin ? <>
              <form onSubmit={adjustStock} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
                <label className="block text-sm font-medium text-slate-700">Product<select required value={stockForm.product_id} onChange={(event) => setStockForm({ ...stockForm, product_id: event.target.value })} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-base font-normal text-slate-950 focus:border-emerald-700 focus:outline-none"><option value="">Select product</option>{activeProducts.map((product) => <option key={product.id} value={product.id}>{product.name} · {product.unit}</option>)}</select></label>
                <Field label="Quantity change (+ or −)" type="number" step="0.001" required value={stockForm.quantity_delta} onChange={(quantity_delta) => setStockForm({ ...stockForm, quantity_delta })} hint={activeProducts.find((product) => product.id === stockForm.product_id)?.unit ? `Measured in ${activeProducts.find((product) => product.id === stockForm.product_id).unit}.` : 'Select a product to see its unit.'} />
                <label className="block text-sm font-medium text-slate-700">Transaction type<select value={stockForm.transaction_type} onChange={(event) => setStockForm({ ...stockForm, transaction_type: event.target.value })} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-base font-normal text-slate-950 focus:border-emerald-700 focus:outline-none"><option>Purchase</option><option>Manual Adjustment</option><option>Return</option></select></label>
                <Field label="Reason / reference" required value={stockForm.reason} onChange={(reason) => setStockForm({ ...stockForm, reason })} />
                <button disabled={busy} className="min-h-11 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60 sm:col-span-2 lg:col-span-4">Record stock movement</button>
              </form>
              <section className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                <h2 className="px-5 py-4 font-semibold text-slate-900">Recent stock transactions</h2>
                <table className="w-full min-w-[600px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600"><tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Change</th><th className="px-4 py-3">Balance</th><th className="px-4 py-3">Reason</th></tr></thead><tbody className="divide-y divide-slate-100">{data.transactions.map((transaction) => <tr key={transaction.id}><td className="px-4 py-3 font-medium text-slate-900">{transaction.product_name}</td><td className="px-4 py-3 text-slate-700">{transaction.transaction_type}</td><td className={`px-4 py-3 font-semibold ${Number(transaction.quantity_delta) < 0 ? 'text-rose-800' : 'text-emerald-800'}`}>{quantityWithUnit(transaction.quantity_delta, transaction.unit)}</td><td className="px-4 py-3 text-slate-700">{quantityWithUnit(transaction.balance_after, transaction.unit)}</td><td className="px-4 py-3 text-slate-600">{transaction.reason || '—'}</td></tr>)}{!data.transactions.length ? <tr><td colSpan="5" className="px-4 py-8 text-center text-slate-600">No stock movements recorded.</td></tr> : null}</tbody></table>
              </section>
            </> : <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">Inventory adjustments and transaction history are available to Admins. You can view stock levels in the product catalog.</p>}
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <h2 className="px-5 py-4 font-semibold text-slate-900">Current stock</h2>
              <table className="w-full min-w-[600px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600"><tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">On hand</th><th className="px-4 py-3">Reorder level</th><th className="px-4 py-3">Stock status</th></tr></thead><tbody className="divide-y divide-slate-100">{data.inventory.map((item) => { const low = Number(item.quantity) <= Number(item.reorder_level); return <tr key={item.product_id}><td className="px-4 py-3 font-medium text-slate-900">{item.product_name}</td><td className="px-4 py-3 text-slate-800">{quantityWithUnit(item.quantity, item.unit)}</td><td className="px-4 py-3 text-slate-700">{quantityWithUnit(item.reorder_level, item.unit)}</td><td className="px-4 py-3"><span className={`text-xs font-semibold ${low ? 'text-amber-900' : 'text-emerald-800'}`}>{low ? 'Reorder needed' : 'In stock'}</span></td></tr>})}{!data.inventory.length ? <tr><td colSpan="4" className="px-4 py-8 text-center text-slate-600">Add products to start tracking stock.</td></tr> : null}</tbody></table>
            </div>
          </section>
        ) : null}

        {!loading && section === 'reports' ? (
          <section className="mt-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-5">
              <div><h2 className="font-semibold text-slate-900">Sales report</h2><p className="mt-1 text-sm text-slate-600">Approved orders, grouped by product. Values use INR and exclude taxes.</p></div>
              <button type="button" onClick={downloadReport} disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"><ArrowDownToLine size={16} /> Export CSV</button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-white p-5"><p className="text-sm text-slate-600">Approved orders</p><p className="mt-2 text-2xl font-semibold text-slate-950">{data.report?.approved_order_count || 0}</p></div>
              <div className="rounded-lg border border-slate-200 bg-white p-5"><p className="text-sm text-slate-600">Approved sales value</p><p className="mt-2 text-2xl font-semibold text-slate-950">{money(data.report?.approved_sales_total)}</p></div>
            </div>
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full min-w-[500px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600"><tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Quantity sold</th><th className="px-4 py-3">Sales value</th></tr></thead><tbody className="divide-y divide-slate-100">{data.report?.product_sales?.map((row) => <tr key={`${row.product_id}-${row.unit}`}><td className="px-4 py-4 font-medium text-slate-900">{row.product_name}</td><td className="px-4 py-4 text-slate-700">{quantityWithUnit(row.quantity, row.unit)}</td><td className="px-4 py-4 font-semibold text-slate-900">{money(row.sales_total)}</td></tr>)}{!data.report?.product_sales?.length ? <tr><td colSpan="3" className="px-4 py-8 text-center text-slate-600">Approved sales will appear here.</td></tr> : null}</tbody></table>
            </div>
            <div className="grid gap-5 xl:grid-cols-2">
              <ReportTable title="Dealer-wise sales" rows={data.reports.dealerSales} columns={[['dealer_name', 'Dealer'], ['order_count', 'Orders'], ['sales_total', 'Sales value']]} onExport={() => downloadReport('dealer-sales')} busy={busy} />
              <ReportTable title="Sales representative performance" rows={data.reports.repPerformance} columns={[['sales_rep_name', 'Sales representative'], ['order_count', 'Orders'], ['sales_total', 'Sales value']]} onExport={() => downloadReport('rep-performance')} busy={busy} />
              <ReportTable title="Monthly sales" rows={data.reports.monthlySales} columns={[['month', 'Month'], ['order_count', 'Orders'], ['sales_total', 'Sales value']]} onExport={() => downloadReport('monthly-sales')} busy={busy} />
              <ReportTable title="Low-stock products" rows={data.reports.lowStock} columns={[['product_code', 'Code'], ['product_name', 'Product'], ['quantity', 'On hand'], ['reorder_level', 'Reorder at']]} onExport={() => downloadReport('low-stock')} busy={busy} />
              {isAdmin ? <>
                <ReportTable title="Pending orders" rows={data.reports.pendingOrders} columns={[['order_number', 'Order'], ['dealer_name', 'Dealer'], ['sales_rep_name', 'Sales representative'], ['total_amount', 'Amount']]} onExport={() => downloadReport('pending-orders')} busy={busy} />
                <ReportTable title="Inventory movement" rows={data.reports.inventoryMovement} columns={[['product_code', 'Code'], ['product_name', 'Product'], ['transaction_type', 'Type'], ['transaction_count', 'Transactions'], ['net_quantity', 'Net quantity']]} onExport={() => downloadReport('inventory-movement')} busy={busy} />
              </> : null}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
};

export default SalesInventoryDashboard;
