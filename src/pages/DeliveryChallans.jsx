import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownToLine,
  FileText,
  Search,
  Trash2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import DateInput from '../components/DateInput';
import { useAuth } from '../context/useAuth';
import { deleteQuotation, getQuotations, updateInvoicePaymentStatus } from '../integration/backend/api';
import { getDeliveryChallanPaymentStatus } from '../utils/documentTypes';
import { formatAppDate } from '../utils/dateFormat';

const formatMoney = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const getDateKey = (value) => {
  const dateKey = String(value || '').slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(dateKey) ? dateKey : '';
};

const DeliveryChallans = () => {
  const { logout, user } = useAuth();
  const [challans, setChallans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [downloadingId, setDownloadingId] = useState('');
  const [updatingStatusId, setUpdatingStatusId] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const loadChallans = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const docs = await getQuotations();
      // Filter for delivery challans by title
      const challanDocs = (docs || []).filter(
        (d) => d.title === 'Delivery Challan',
      );
      setChallans(challanDocs);
    } catch (requestError) {
      setError(requestError.message || 'Unable to load delivery challans.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChallans();
  }, [loadChallans]);

  const invalidDateRange = Boolean(dateFrom && dateTo && dateFrom > dateTo);

  const dateFilteredChallans = useMemo(() => {
    if (invalidDateRange) return [];
    if (!dateFrom && !dateTo) return challans;
    return challans.filter((challan) => {
      const issueDate = getDateKey(challan.issued_at);
      return Boolean(issueDate) && (!dateFrom || issueDate >= dateFrom) && (!dateTo || issueDate <= dateTo);
    });
  }, [challans, dateFrom, dateTo, invalidDateRange]);

  const documents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return dateFilteredChallans
      .filter(
        (doc) =>
          !query ||
          [doc.quotation_number, doc.reference_number, doc.customer_name, doc.status,
            getDeliveryChallanPaymentStatus(doc)]
            .some((value) => value?.toLowerCase().includes(query)),
      )
      .filter((doc) =>
        paymentFilter === 'all' ||
        getDeliveryChallanPaymentStatus(doc).toLowerCase() === paymentFilter,
      )
      .sort((left, right) => new Date(right.issued_at) - new Date(left.issued_at));
  }, [dateFilteredChallans, paymentFilter, search]);

  const paymentTotals = useMemo(() => {
    return documents.reduce((totals, challan) => {
      const status = getDeliveryChallanPaymentStatus(challan);
      const amount = Number(challan.total_amount) || 0;
      totals.total += amount;
      if (status === 'Paid') totals.paid += amount;
      if (status === 'Unpaid') totals.unpaid += amount;
      return totals;
    }, { total: 0, paid: 0, unpaid: 0 });
  }, [documents]);

  const handlePaymentStatusChange = async (challan) => {
    const currentStatus = getDeliveryChallanPaymentStatus(challan);
    const nextStatus = currentStatus === 'Paid' ? 'Unpaid' : 'Paid';
    setUpdatingStatusId(challan.id);
    try {
      const updatedChallan = await updateInvoicePaymentStatus(challan.id, nextStatus);
      setChallans((current) => current.map((item) =>
        item.id === updatedChallan.id ? updatedChallan : item,
      ));
      toast.success(`Delivery challan marked ${nextStatus.toLowerCase()}`);
    } catch (requestError) {
      toast.error(requestError.message || 'Could not update delivery challan payment status.');
    } finally {
      setUpdatingStatusId('');
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Permanently delete challan ${doc.reference_number}?`)) return;
    try {
      await deleteQuotation(doc.id);
      setChallans((current) => current.filter((item) => item.id !== doc.id));
      toast.success('Delivery challan deleted');
    } catch (requestError) {
      toast.error(requestError.message || 'Could not delete challan.');
    }
  };

  const handleDownload = async (doc) => {
    setDownloadingId(doc.id);
    const number = doc.quotation_number || doc.reference_number || doc.id;
    const filename = `${number}.pdf`;
    try {
      // Build challan data from saved document
      const challanData = buildChallanPdfData(doc, user);
      const blob = await createDeliveryChallanPdfBlob(challanData);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success('Delivery challan downloaded');
    } catch (requestError) {
      toast.error(requestError.message || 'Could not download PDF. Please try again.');
    } finally {
      setDownloadingId('');
    }
  };

  return (
    <div className="documents-page min-h-screen bg-[#F8F9FA] text-[#2D3748]">
      <style>{`
        .documents-page ::selection { background: #fed7aa; color: #9a3412; }
        .documents-page ::-moz-selection { background: #fed7aa; color: #9a3412; }
        .documents-page ::-webkit-scrollbar { width: 8px; height: 8px; }
        .documents-page ::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
        .documents-page ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .documents-page ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
      <Header onLogout={logout} user={user} />
      <main className="documents-page mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-semibold text-[#FF6B35]">
              Delivery management
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#1E3A5F]">
              Delivery Challans
            </h1>
            <p className="mt-2 text-sm text-[#2D3748]/60">
              Track, manage and download delivery challans.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/challan-products"
              className="inline-flex items-center gap-2 rounded-lg border border-[#1E3A5F]/10 bg-white px-4 py-3 text-sm font-semibold text-[#1E3A5F] transition hover:border-[#FF6B35] hover:text-[#FF6B35]"
            >
              Manage challan products
            </Link>
            <Link
              to="/delivery-challan/new"
              className="inline-flex items-center gap-2 rounded-lg bg-[#FF6B35] px-4 py-3 text-sm font-semibold text-white shadow-cta transition hover:bg-[#e55a28]"
            >
              <FileText size={16} />
              Create challan
            </Link>
          </div>
        </div>

        <section className="mb-4 rounded-xl border border-[#1E3A5F]/10 bg-white p-5 shadow-card-sm" aria-label="Filter delivery challans by issue date">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-sm font-semibold tracking-tight text-[#1E3A5F]">Challan date range</h2>
            <button
              type="button"
              onClick={() => { setDateFrom(''); setDateTo(''); }}
              disabled={!dateFrom && !dateTo}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-[#FF6B35] transition hover:bg-orange-50 disabled:cursor-default disabled:text-[#2D3748]/40 disabled:hover:bg-transparent"
            >
              All dates
            </button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <DateInput label="From" value={dateFrom} max={dateTo || undefined} onChange={(event) => setDateFrom(event.target.value)} />
            <DateInput label="To" value={dateTo} min={dateFrom || undefined} onChange={(event) => setDateTo(event.target.value)} />
          </div>
          {invalidDateRange ? (
            <p role="alert" className="mt-3 text-sm text-rose-700">The start date must be on or before the end date.</p>
          ) : null}
        </section>

        <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Delivery challan payment totals">
          <article className="rounded-xl border border-[#1E3A5F]/10 bg-white p-5 shadow-card-sm">
            <p className="text-sm font-medium text-[#2D3748]">Total amount shown</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-[#1E3A5F]">{formatMoney(paymentTotals.total)}</p>
            <p className="mt-1 text-xs text-[#2D3748]/60">Matches the challans shown below</p>
          </article>
          <article className="rounded-xl border border-green-200/60 bg-white p-5 shadow-card-sm">
            <p className="text-sm font-medium text-green-700">Paid challans</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-[#1E3A5F]">{formatMoney(paymentTotals.paid)}</p>
            <p className="mt-1 text-xs text-[#2D3748]/60">Paid challans matching the current filters</p>
          </article>
          <article className="rounded-xl border border-amber-200/60 bg-white p-5 shadow-card-sm">
            <p className="text-sm font-medium text-amber-700">Unpaid challans</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-[#1E3A5F]">{formatMoney(paymentTotals.unpaid)}</p>
            <p className="mt-1 text-xs text-[#2D3748]/60">Unpaid challans matching the current filters</p>
          </article>
        </section>

        <section className="overflow-hidden rounded-xl border border-[#1E3A5F]/10 bg-white shadow-card-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E3A5F]/10 px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-sm font-semibold text-[#1E3A5F]">All challans</h2>
              <p className="mt-1 text-xs text-[#2D3748]/60">
                {loading ? 'Loading your challans…' : `${documents.length} challan${documents.length === 1 ? '' : 's'}`}
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-[#1E3A5F]/5 p-1" role="group" aria-label="Filter delivery challans by payment status">
              {[
                { value: 'all', label: 'All' },
                { value: 'unpaid', label: 'Unpaid' },
                { value: 'paid', label: 'Paid' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={paymentFilter === value}
                  onClick={() => setPaymentFilter(value)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                    paymentFilter === value
                      ? 'bg-white text-[#1E3A5F] shadow-card-sm'
                      : 'text-[#2D3748]/60 hover:text-[#1E3A5F]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <label className="flex w-full max-w-xs items-center gap-2 rounded-lg border border-[#1E3A5F]/10 bg-white px-3 py-2 text-[#2D3748]/40 focus-within:border-[#FF6B35]">
              <Search size={15} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search DC number or consignee"
                aria-label="Search delivery challans"
                className="w-full bg-transparent text-xs text-[#1E3A5F] outline-none placeholder:text-[#2D3748]/40"
              />
            </label>
          </div>

          {error ? (
            <div role="alert" className="flex flex-wrap items-center justify-between gap-3 bg-rose-50 px-6 py-4">
              <p className="text-sm text-rose-800">{error}</p>
              <button type="button" onClick={loadChallans} className="text-sm font-semibold text-rose-800 underline">
                Try again
              </button>
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[730px] text-left text-sm">
              <thead className="bg-[#1E3A5F]/5 text-[11px] font-semibold uppercase tracking-wide text-[#1E3A5F]/60">
                <tr>
                  <th className="px-6 py-3">DC Number</th>
                  <th className="px-4 py-3">Consignee</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E3A5F]/5">
                {documents.map((doc) => {
                  const status = getDeliveryChallanPaymentStatus(doc);
                  const isPayableChallan = ['Paid', 'Unpaid'].includes(status);
                  const statusColor =
                    status.toLowerCase() === 'draft'
                      ? 'bg-[#1E3A5F]/10 text-[#1E3A5F]'
                      : status.toLowerCase() === 'paid'
                        ? 'bg-green-50 text-green-700'
                        : status.toLowerCase() === 'unpaid'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-[#1E3A5F]/10 text-[#1E3A5F]';
                  return (
                    <tr key={doc.id} className="transition hover:bg-[#1E3A5F]/5">
                      <td className="px-6 py-4">
                        <span className="block font-semibold text-[#1E3A5F]">
                          {doc.quotation_number || doc.reference_number}
                        </span>
                        <span className="mt-0.5 block text-xs text-[#2D3748]/60">{doc.title || 'Delivery Challan'}</span>
                      </td>
                      <td className="px-4 py-4 text-[#2D3748]">{doc.customer_name || '—'}</td>
                      <td className="px-4 py-4 text-[#2D3748]/60">{formatAppDate(doc.issued_at)}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col items-start gap-2">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusColor}`}>
                            {status}
                          </span>
                          {isPayableChallan ? (
                            <button
                              type="button"
                              onClick={() => handlePaymentStatusChange(doc)}
                              disabled={updatingStatusId === doc.id}
                              aria-label={`Mark delivery challan ${doc.reference_number} ${status === 'Paid' ? 'unpaid' : 'paid'}`}
                              className="text-xs font-semibold text-[#FF6B35] underline decoration-orange-300 underline-offset-2 hover:text-[#e55a28] disabled:opacity-50"
                            >
                              {updatingStatusId === doc.id
                                ? 'Updating…'
                                : status === 'Paid' ? 'Mark unpaid' : 'Mark paid'}
                            </button>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right font-semibold text-[#1E3A5F]">
                        {formatMoney(doc.total_amount)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleDownload(doc)}
                            disabled={downloadingId === doc.id}
                            aria-label={`Download ${doc.reference_number} PDF`}
                            className="flex h-9 items-center gap-1.5 rounded-lg border border-[#1E3A5F]/10 px-2.5 text-xs font-semibold text-[#1E3A5F] transition hover:border-[#FF6B35] hover:text-[#FF6B35] disabled:opacity-50"
                          >
                            <ArrowDownToLine size={14} />
                            <span className="hidden sm:inline">{downloadingId === doc.id ? 'Preparing…' : 'PDF'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(doc)}
                            aria-label={`Delete ${doc.reference_number}`}
                            className="flex h-9 items-center gap-1.5 rounded-lg border border-[#1E3A5F]/10 px-2.5 text-xs font-semibold text-[#2D3748]/60 transition hover:border-rose-200 hover:text-rose-700"
                          >
                            <Trash2 size={14} />
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!loading && documents.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-[#1E3A5F]/10 text-[#1E3A5F]/60">
                <FileText size={21} />
              </span>
              <h3 className="mt-4 text-sm font-semibold text-[#1E3A5F]">
                {search
                  ? 'No matching challans'
                  : invalidDateRange
                    ? 'Invalid date range'
                    : paymentFilter !== 'all'
                      ? `No ${paymentFilter} challans`
                  : 'No delivery challans yet'}
              </h3>
              <p className="mt-1 text-xs text-[#2D3748]/60">
                {search
                  ? 'Try another DC number or consignee name.'
                  : invalidDateRange
                    ? 'Choose a start date on or before the end date.'
                    : paymentFilter !== 'all'
                      ? `There are no ${paymentFilter} delivery challans in this view.`
                  : 'Create your first delivery challan to get started.'}
              </p>
              {!search && paymentFilter === 'all' ? (
                <Link to="/delivery-challan/new" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#FF6B35] underline">
                  Create challan
                </Link>
              ) : null}
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
};

// Build challan data from saved document for PDF generation
const buildChallanPdfData = (doc, user) => {
  const items = (doc.items || []).map((item) => ({
    id: item.id,
    crop: item.product_name || 'Item',
    variety: '',
    seedClass: '',
    lotNo: '',
    unitSize: '',
    unitPerSackBox: '',
    sackBox: '',
    qtyKgs: Number(item.quantity || 0),
    value: Number(item.unit_price || 0),
  }));

  const summary = {
    subtotal: items.reduce((sum, item) => sum + item.qtyKgs * item.value, 0),
    shipping: Number(doc.shipping_amount || 0),
    grandTotal: items.reduce((sum, item) => sum + item.qtyKgs * item.value, 0) + Number(doc.shipping_amount || 0),
  };

  return {
    documentType: 'delivery_challan',
    company: {
      name: doc.company_name || user?.company_name || '',
      address: doc.company_address || user?.company_address || '',
      phone: doc.company_phone_number || user?.company_phone_number || '',
      email: doc.company_email || user?.company_email || '',
      gstin: doc.company_gstin || '',
      logoData: user?.company_logo_data || '',
      sealData: user?.company_seal_data || '',
    },
    consignor: {
      name: doc.company_name || user?.company_name || '',
      address: doc.company_address || user?.company_address || '',
      phone: doc.company_phone_number || user?.company_phone_number || '',
      email: doc.company_email || user?.company_email || '',
      gstin: doc.company_gstin || '',
      mNo: doc.consignor_mNo || '',
      co: doc.consignor_co || '',
    },
    consignee: {
      name: doc.customer_name || '',
      code: doc.consignee_code || '',
      place: doc.customer_address || '',
      contactNo: doc.customer_phone_number || '',
      gst: doc.customer_gstin || '',
      deliveredTo: doc.consignee_deliveredTo || '',
    },
    challan: {
      dcNumber: doc.quotation_number || doc.reference_number || '',
      date: doc.issued_at ? new Date(doc.issued_at).toISOString().slice(0, 10) : '',
      notes: doc.terms || '',
    },
    items,
    summary,
    quotation: {
      authorizedPerson: user?.username || user?.name || '',
    },
  };
};

// PDF generation helper
const createDeliveryChallanPdfBlob = async (data) => {
  const [{ pdf }, { default: DeliveryChallanPDF }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('../pdf/DeliveryChallanPDF'),
  ]);
  return pdf(DeliveryChallanPDF({ data })).toBlob();
};

export default DeliveryChallans;
