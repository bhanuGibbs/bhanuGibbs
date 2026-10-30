import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CircleDollarSign,
  Clock3,
  FileCheck2,
  FilePlus2,
  FileText,
  Package,
  Receipt,
  RotateCcw,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import { useAuth } from '../context/useAuth';
import { getCustomers, getProducts, getQuotations } from '../integration/backend/api';
import { isInvoiceDocument } from '../utils/documentTypes';
import { formatAppDate } from '../utils/dateFormat';

const formatMoney = (value, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency || 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [data, setData] = useState({ quotations: [], customers: [], products: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [quotations, customers, products] = await Promise.all([
        getQuotations(),
        getCustomers(),
        getProducts(),
      ]);
      setData({ quotations, customers, products });
    } catch (requestError) {
      setError(requestError.message || 'Your workspace data could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const documents = useMemo(
    () =>
      [...data.quotations].sort(
        (left, right) => new Date(right.created_at || right.issued_at) - new Date(left.created_at || left.issued_at),
      ),
    [data.quotations],
  );
  const invoices = data.quotations.filter(isInvoiceDocument);
  const outstanding = invoices
    .filter((invoice) => !['paid', 'cancelled', 'void'].includes((invoice.status || '').toLowerCase()))
    .reduce((sum, invoice) => sum + Number(invoice.total_amount || 0), 0);
  const activeQuotations = data.quotations.filter(
    (document) =>
      !isInvoiceDocument(document) &&
      ['draft', 'final'].includes((document.status || '').toLowerCase()),
  ).length;

  const stats = [
    {
      label: 'Invoices issued',
      value: invoices.length,
      detail: invoices.length ? 'Documents saved to your workspace' : 'No invoices issued yet',
      icon: Receipt,
    },
    {
      label: 'Outstanding',
      value: formatMoney(outstanding),
      detail: invoices.length ? 'Issued invoices awaiting payment' : 'Create an invoice to track payments',
      icon: CircleDollarSign,
      accent: 'emerald',
    },
    {
      label: 'Open quotations',
      value: activeQuotations,
      detail: 'Draft and finalized quotes awaiting response',
      icon: FileCheck2,
    },
    { label: 'Customers', value: data.customers.length, detail: 'In your customer directory', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-slate-900">
      <Header onLogout={logout} user={user} />
      <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700">Your workspace</p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-[34px]">
              Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user?.username || 'there'}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {user?.company_name
                ? `Here’s what’s happening at ${user.company_name}.`
                : 'Your business at a glance. Pick up where you left off.'}
            </p>
          </div>
        </div>

        {error ? (
          <div role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <p className="text-sm text-rose-800">{error}</p>
            <button
              type="button"
              onClick={loadDashboard}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-800 disabled:opacity-60"
            >
              <RotateCcw size={14} /> Try again
            </button>
          </div>
        ) : null}

        <section aria-label="Business overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(({ label, value, detail, icon: Icon, accent }) => (
            <article key={label} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[13px] font-medium text-slate-500">{label}</span>
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    accent === 'emerald' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <Icon size={17} strokeWidth={1.8} />
                </span>
              </div>
              <p className="mt-4 text-[27px] font-semibold leading-none tracking-tight text-slate-950">
                {loading ? <span className="inline-block h-7 w-20 animate-pulse rounded bg-slate-100" /> : value}
              </p>
              <p className="mt-2 text-xs text-slate-500">{detail}</p>
            </article>
          ))}
        </section>

        <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_335px]">
          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Recent documents</h2>
                <p className="mt-1 text-xs text-slate-500">Your latest invoices and quotations.</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3">Document</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {documents.slice(0, 6).map((document) => {
                    const isInvoice = isInvoiceDocument(document);
                    return (
                      <tr key={document.id} className="transition hover:bg-slate-50/70">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${isInvoice ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                              {isInvoice ? <Receipt size={16} /> : <FileText size={16} />}
                            </span>
                            <span>
                              <span className="block font-semibold text-slate-800">
                                {document.quotation_number ||
                                  ((document.status || '').toLowerCase() === 'draft'
                                    ? 'Draft'
                                    : document.reference_number)}
                              </span>
                              <span className="mt-0.5 block text-xs text-slate-500">{isInvoice ? 'Invoice' : 'Quotation'}</span>
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-slate-600">{document.customer_name || '—'}</td>
                        <td className="px-4 py-4 text-slate-500">{formatAppDate(document.issued_at)}</td>
                        <td className="px-4 py-4">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700">
                            {document.status || 'Draft'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-slate-800">
                          {formatMoney(document.total_amount, document.currency)}
                        </td>
                      </tr>
                    );
                  })}
                  {!loading && documents.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <FileText size={25} className="mx-auto text-slate-300" />
                        <p className="mt-3 text-sm font-medium text-slate-700">No documents yet</p>
                        <p className="mt-1 text-xs text-slate-500">Create a quotation or invoice to see it here.</p>
                        <Link to="/new" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
                          Create your first document <ArrowRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">Quick actions</h2>
              <div className="mt-4 space-y-2">
                <Link to="/new" className="group flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-emerald-200 hover:bg-emerald-50/50">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><FilePlus2 size={17} /></span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-800">New document</span><span className="mt-0.5 block text-xs text-slate-500">Prepare an invoice or quote</span></span>
                  <ArrowUpRight size={15} className="text-slate-400 transition group-hover:text-emerald-700" />
                </Link>
                <Link to="/customers" className="group flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-emerald-200 hover:bg-emerald-50/50">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700"><Users size={17} /></span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-800">Add a customer</span><span className="mt-0.5 block text-xs text-slate-500">{loading ? 'Loading directory…' : `${data.customers.length} in your directory`}</span></span>
                  <ArrowUpRight size={15} className="text-slate-400 transition group-hover:text-emerald-700" />
                </Link>
                <Link to="/products" className="group flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-emerald-200 hover:bg-emerald-50/50">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700"><Package size={17} /></span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-800">Manage products</span><span className="mt-0.5 block text-xs text-slate-500">{loading ? 'Loading catalog…' : `${data.products.length} in your catalog`}</span></span>
                  <ArrowUpRight size={15} className="text-slate-400 transition group-hover:text-emerald-700" />
                </Link>
              </div>
            </section>

            <section className="rounded-2xl bg-slate-950 p-5 text-white shadow-sm">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10"><Clock3 size={17} /></span>
              <h2 className="mt-4 text-sm font-semibold">Keep everything up to date</h2>
              <p className="mt-2 text-xs leading-5 text-slate-300">
                Add customer and company details once, then reuse them across your billing documents.
              </p>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
