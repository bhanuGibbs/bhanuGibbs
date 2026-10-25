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
import { useAuth } from '../context/AuthContext';
import { deleteQuotation, getQuotations, updateInvoicePaymentStatus } from '../integration/backend/api';
import { buildSavedDocumentPdfData, createDocumentPdfBlob, downloadPdfBlob } from '../pdf/documentPdf';
import { getInvoicePaymentStatus, isInvoiceDocument } from '../utils/documentTypes';

const formatMoney = (value, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency || 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
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

  const documents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return quotations
      .filter((document) => isInvoiceDocument(document) === isBilling)
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
  }, [isBilling, paymentFilter, quotations, search]);

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
    try {
      const number = document.quotation_number || document.reference_number || document.id;
      const blob = await createDocumentPdfBlob(buildSavedDocumentPdfData(document, user));
      await downloadPdfBlob(blob, `${number}.pdf`);
      toast.success(`${isBilling ? 'Invoice' : 'Quotation'} downloaded`);
    } catch (requestError) {
      toast.error(requestError.message || 'Could not download PDF.');
    } finally {
      setDownloadingId('');
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-slate-900">
      <Header onLogout={logout} user={user} />
      <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700">
              {isBilling ? 'Accounts receivable' : 'Sales workspace'}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              {isBilling ? 'Invoices' : 'Quotations'}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {isBilling ? 'Track, manage and download customer invoices.' : 'Review the proposals saved for your customers.'}
            </p>
          </div>
          <Link
            to="/new"
            state={{ documentMode: isBilling ? 'billing' : 'quotation' }}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
          >
            {isBilling ? <Receipt size={16} /> : <FileText size={16} />}
            Create {isBilling ? 'invoice' : 'quotation'}
          </Link>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
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
                        ? 'bg-white text-slate-900 shadow-sm'
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
                      <td className="px-4 py-4 text-slate-500">{formatDate(document.issued_at)}</td>
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
