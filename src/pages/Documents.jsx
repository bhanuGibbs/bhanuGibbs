import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowRight,
  FileText,
  Receipt,
  Search,
  Trash2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import DateInput from '../components/DateInput';
import { useAuth } from '../context/useAuth';
import { deleteQuotation, downloadQuotationPdf, getQuotations, updateInvoicePaymentStatus } from '../integration/backend/api';
import { buildSavedDocumentPdfData, createDocumentPdfBlob, downloadPdfBlob } from '../pdf/documentPdf';
import { getInvoicePaymentStatus, isInvoiceDocument } from '../utils/documentTypes';
import { formatAppDate } from '../utils/dateFormat';

const formatMoney = (value, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency || 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const getDateKey = (value) => {
  const dateKey = String(value || '').slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(dateKey) ? dateKey : '';
};

const Documents = ({ documentType }) => {
  const isBilling = ['billing', 'invoice'].includes(documentType);
  const { logout, user } = useAuth();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [downloadingId, setDownloadingId] = useState('');
  const [updatingStatusId, setUpdatingStatusId] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setQuotations(await getQuotations());
    } catch (requestError) {
      setError(requestError.message || `Unable to load ${isBilling ? 'invoices' : 'quotations'}.`);
    } finally {
      setLoading(false);
    }
  }, [isBilling]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const invalidDateRange = Boolean(dateFrom && dateTo && dateFrom > dateTo);

  const dateFilteredDocuments = useMemo(() => {
    if (!isBilling) return quotations.filter((document) => isInvoiceDocument(document) === isBilling);
    if (invalidDateRange) return [];

    return quotations
      .filter(isInvoiceDocument)
      .filter((invoice) => {
        const issueDate = getDateKey(invoice.issued_at);
        return Boolean(issueDate) && (!dateFrom || issueDate >= dateFrom) && (!dateTo || issueDate <= dateTo);
      });
  }, [dateFrom, dateTo, invalidDateRange, isBilling, quotations]);

  const documents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return dateFilteredDocuments
      .filter(
        (document) =>
          !query ||
          [document.quotation_number, document.reference_number, document.customer_name, document.status,
            ...(isBilling ? [getInvoicePaymentStatus(document)] : [])]
            .some((value) => value?.toLowerCase().includes(query)),
      )
      .filter((document) =>
        !isBilling || paymentFilter === 'all' ||
        getInvoicePaymentStatus(document).toLowerCase() === paymentFilter,
      )
      .sort((left, right) => new Date(right.issued_at) - new Date(left.issued_at));
  }, [dateFilteredDocuments, isBilling, paymentFilter, search]);

  const paymentTotals = useMemo(() => {
    return dateFilteredDocuments.reduce((totals, invoice) => {
      const status = getInvoicePaymentStatus(invoice);
      if (status === 'Paid') totals.paid += Number(invoice.total_amount) || 0;
      if (status === 'Unpaid') totals.unpaid += Number(invoice.total_amount) || 0;
      return totals;
    }, { paid: 0, unpaid: 0 });
  }, [dateFilteredDocuments]);

  const handlePaymentStatusChange = async (document) => {
    const currentStatus = getInvoicePaymentStatus(document);
    const nextStatus = currentStatus === 'Paid' ? 'Unpaid' : 'Paid';
    setUpdatingStatusId(document.id);
    try {
      const updatedDocument = await updateInvoicePaymentStatus(document.id, nextStatus);
      setQuotations((current) => current.map((item) =>
        item.id === updatedDocument.id ? updatedDocument : item,
      ));
      toast.success(`Invoice marked ${nextStatus.toLowerCase()}`);
    } catch (requestError) {
      toast.error(requestError.message || 'Could not update invoice payment status.');
    } finally {
      setUpdatingStatusId('');
    }
  };

  const handleDelete = async (document) => {
    const label = isBilling ? 'invoice' : 'quotation';
    if (!window.confirm(`Permanently delete ${label} ${document.reference_number}?`)) return;
    try {
      await deleteQuotation(document.id);
      setQuotations((current) => current.filter((item) => item.id !== document.id));
      toast.success(`${isBilling ? 'Invoice' : 'Quotation'} deleted`);
    } catch (requestError) {
      toast.error(requestError.message || `Could not delete ${label}.`);
    }
  };

  const handleDownload = async (document) => {
    setDownloadingId(document.id);
    const number = document.quotation_number || document.reference_number || document.id;
    const filename = `${number}.pdf`;
    try {
      const blob = await createDocumentPdfBlob(buildSavedDocumentPdfData(document, user));
      await downloadPdfBlob(blob, filename);
      toast.success(`${isBilling ? 'Invoice' : 'Quotation'} downloaded`);
    } catch (requestError) {
      try {
        await downloadQuotationPdf(document.id, filename);
        toast.success(`${isBilling ? 'Invoice' : 'Quotation'} downloaded`);
      } catch (fallbackError) {
        toast.error(fallbackError.message || requestError.message || 'Could not download PDF. Please try again.');
      }
    } finally {
      setDownloadingId('');
    }
  };

  return (
    <div className="documents-page min-h-screen bg-[#f7f8fa] text-slate-900">
      <style>{`
        .documents-page ::selection { background: #d1fae5; color: #065f46; }
        .documents-page ::-moz-selection { background: #d1fae5; color: #065f46; }
        .documents-page ::-webkit-scrollbar { width: 8px; height: 8px; }
        .documents-page ::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
        .documents-page ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .documents-page ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
      <Header onLogout={logout} user={user} />
      <main className="documents-page mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
              {isBilling ? 'Accounts receivable' : 'Sales workspace'}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {isBilling ? 'Invoices' : 'Quotations'}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {isBilling ? 'Track, manage and download customer invoices.' : 'Review the proposals saved for your customers.'}
            </p>
          </div>
          <Link
            to="/new"
            state={{ documentMode: isBilling ? 'billing' : 'quotation' }}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-900"
          >
            {isBilling ? <Receipt size={16} /> : <FileText size={16} />}
            Create {isBilling ? 'invoice' : 'quotation'}
          </Link>
        </div>

        {isBilling ? (
          <>
          <section className="mb-4 rounded-2xl border border-slate-200/60 bg-white p-5" aria-label="Filter invoices by issue date">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold tracking-tight text-slate-900">Invoice date range</h2>
              </div>
              <button
                type="button"
                onClick={() => { setDateFrom(''); setDateTo(''); }}
                disabled={!dateFrom && !dateTo}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-default disabled:text-slate-400 disabled:hover:bg-transparent"
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

          <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Invoice payment totals">
            <article className="rounded-2xl border border-slate-200/60 bg-white p-5">
              <p className="text-sm font-medium text-slate-700">Total invoiced</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{formatMoney(paymentTotals.paid + paymentTotals.unpaid)}</p>
              <p className="mt-1 text-xs text-slate-500">Paid and unpaid invoices in this date range</p>
            </article>
            <article className="rounded-2xl border border-emerald-200/60 bg-white p-5">
              <p className="text-sm font-medium text-emerald-700">Paid invoices</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{formatMoney(paymentTotals.paid)}</p>
              <p className="mt-1 text-xs text-slate-500">Total amount recorded as paid</p>
            </article>
            <article className="rounded-2xl border border-amber-200/60 bg-white p-5">
              <p className="text-sm font-medium text-amber-700">Unpaid invoices</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{formatMoney(paymentTotals.unpaid)}</p>
              <p className="mt-1 text-xs text-slate-500">Total amount still awaiting payment</p>
            </article>
          </section>
          </>
        ) : null}

        <section className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">All {isBilling ? 'invoices' : 'quotations'}</h2>
              <p className="mt-1 text-xs text-slate-500">{loading ? 'Loading your documents…' : `${documents.length} document${documents.length === 1 ? '' : 's'}`}</p>
            </div>
            {isBilling ? (
              <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1" role="group" aria-label="Filter invoices by payment status">
                {[
                  {value: 'all', label: 'All'},
                  {value: 'unpaid', label: 'Unpaid'},
                  {value: 'paid', label: 'Paid'},
                ].map(({value, label}) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={paymentFilter === value}
                    onClick={() => setPaymentFilter(value)}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                      paymentFilter === value
                        ? 'bg-white text-slate-900'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : null}
            <label className="flex w-full max-w-xs items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-400 focus-within:border-emerald-400">
              <Search size={15} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search reference or customer"
                aria-label={`Search ${isBilling ? 'invoices' : 'quotations'}`}
                className="w-full bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
              />
            </label>
          </div>

          {error ? (
            <div role="alert" className="flex flex-wrap items-center justify-between gap-3 bg-rose-50 px-6 py-4">
              <p className="text-sm text-rose-800">{error}</p>
              <button type="button" onClick={loadDocuments} className="text-sm font-semibold text-rose-800 underline">
                Try again
              </button>
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[730px] text-left text-sm">
              <thead className="bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3">{isBilling ? 'Invoice' : 'Quotation'}</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Issue date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.map((document) => {
                  const status = document.status || 'Draft';
                  const paymentStatus = isBilling ? getInvoicePaymentStatus(document) : status;
                  const isPayableInvoice = isBilling && ['Paid', 'Unpaid'].includes(paymentStatus);
                  const statusColor =
                    paymentStatus.toLowerCase() === 'draft'
                      ? 'bg-slate-100 text-slate-700'
                      : paymentStatus.toLowerCase() === 'paid'
                        ? 'bg-emerald-50 text-emerald-700'
                        : paymentStatus.toLowerCase() === 'unpaid'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-slate-100 text-slate-700';
                  return (
                    <tr key={document.id} className="transition hover:bg-slate-50/70">
                      <td className="px-6 py-4">
                        <span className="block font-semibold text-slate-800">
                          {document.quotation_number || document.reference_number}
                        </span>
                        <span className="mt-0.5 block text-xs text-slate-500">{document.title || 'Quotation'}</span>
                      </td>
                      <td className="px-4 py-4 text-slate-700">{document.customer_name || '—'}</td>
                      <td className="px-4 py-4 text-slate-500">{formatAppDate(document.issued_at)}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col items-start gap-2">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusColor}`}>
                            {paymentStatus}
                          </span>
                          {isPayableInvoice ? (
                            <button
                              type="button"
                              onClick={() => handlePaymentStatusChange(document)}
                              disabled={updatingStatusId === document.id}
                              aria-label={`Mark invoice ${document.reference_number} ${paymentStatus === 'Paid' ? 'unpaid' : 'paid'}`}
                              className="text-xs font-semibold text-emerald-700 underline decoration-emerald-300 underline-offset-2 hover:text-emerald-900 disabled:opacity-50"
                            >
                              {updatingStatusId === document.id
                                ? 'Updating?'
                                : paymentStatus === 'Paid' ? 'Mark unpaid' : 'Mark paid'}
                            </button>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right font-semibold text-slate-800">
                        {formatMoney(document.total_amount, document.currency)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleDownload(document)}
                            disabled={downloadingId === document.id}
                            aria-label={`Download ${document.reference_number} PDF`}
                            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-800 disabled:opacity-50"
                          >
                            <ArrowDownToLine size={14} />
                            <span className="hidden sm:inline">{downloadingId === document.id ? 'Preparing…' : 'PDF'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(document)}
                            aria-label={`Delete ${document.reference_number}`}
                            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-xs font-semibold text-slate-500 transition hover:border-rose-200 hover:text-rose-700"
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
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                {isBilling ? <Receipt size={21} /> : <FileText size={21} />}
              </span>
              <h3 className="mt-4 text-sm font-semibold text-slate-900">
                {search
                  ? 'No matching documents'
                  : isBilling && paymentFilter !== 'all'
                    ? `No ${paymentFilter} invoices`
                    : `No ${isBilling ? 'invoices' : 'quotations'} yet`}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                {search
                  ? 'Try another reference number or customer name.'
                  : isBilling && paymentFilter !== 'all'
                    ? `There are no ${paymentFilter} invoices in this view.`
                    : 'Create your first document to get started.'}
              </p>
              {!search && (!isBilling || paymentFilter === 'all') ? (
                <Link to="/new" state={{ documentMode: isBilling ? 'billing' : 'quotation' }} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
                  Create {isBilling ? 'invoice' : 'quotation'} <ArrowRight size={14} />
                </Link>
              ) : null}
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
};

export default Documents;
