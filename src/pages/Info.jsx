import {
  LayoutDashboard,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { useAuth } from '../context/useAuth';

const workflows = [
  {
    title: 'Create professional documents',
    description: 'Build quotations and invoices with your company details, customer information, line items, taxes, discounts, and terms.',
    to: '/new',
    label: 'Create a document',
  },
  {
    title: 'Keep billing organized',
    description: 'Review invoices, filter by payment status, and update an invoice when a customer pays.',
    to: '/billing',
    label: 'Open billing',
  },
  {
    title: 'Manage customers and products',
    description: 'Save customer and product details so they are ready to use in future documents.',
    to: '/customers',
    label: 'Manage customers',
  },
];

const Info = () => {
  const { logout, user } = useAuth();

  return (
    <div className="info-page min-h-screen bg-[#f7f8fa] text-slate-900">
      <style>{`
        .info-page ::selection { background: #d1fae5; color: #065f46; }
        .info-page ::-moz-selection { background: #d1fae5; color: #065f46; }
        .info-page ::-webkit-scrollbar { width: 8px; height: 8px; }
        .info-page ::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
        .info-page ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .info-page ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
      <Header onLogout={logout} user={user} />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-lg bg-slate-950 px-6 py-10 text-white sm:px-10 sm:py-14">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Your billing work, in one place.</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
              Ledger helps you prepare quotations and invoices, keep useful business details close at hand, and stay on top of your billing workflow.
            </p>
            <Link to="/" className="mt-7 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500">
              <LayoutDashboard size={16} /> Go to overview
            </Link>
          </div>
        </section>

        <section className="mt-8 grid gap-6 rounded-lg border border-slate-200/60 bg-white p-6 sm:p-8 md:grid-cols-[1.3fr_1fr]">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-950">A simpler way to handle everyday billing</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Ledger is a business document workspace for preparing quotations and invoices. Keep your company profile, customer records, and product catalog together, then use those details to build clear documents and download them as PDFs.
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Start with a customer and products already in your workspace, then enter quantities, prices, GST, and terms. Review the totals before saving the document as a PDF.
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-5">
            <h3 className="font-semibold text-slate-900">Built for your workflow</h3>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <li><span className="font-semibold text-slate-800">Reusable business details:</span> keep company, customer, and product information ready.</li>
              <li><span className="font-semibold text-slate-800">Flexible documents:</span> include line items, discounts, taxes, shipping, terms, and a signature.</li>
              <li><span className="font-semibold text-slate-800">PDF output:</span> review and download a shareable copy of your document.</li>
            </ul>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-5">
            <h2 className="text-xl font-bold tracking-tight text-slate-950">What you can do</h2>
            <p className="mt-1 text-sm text-slate-500">A quick guide to the main parts of your workspace.</p>
          </div>
          <div className="grid gap-x-8 gap-y-6 md:grid-cols-3">
            {workflows.map(({ title, description, to, label }) => (
              <article key={title} className="flex flex-col border-t border-slate-200 pt-5">
                <h3 className="text-base font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{description}</p>
                <Link to={to} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 underline hover:text-emerald-800">
                  {label}
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-lg border border-emerald-200 bg-emerald-50/70 p-6 sm:p-8">
          <h2 className="text-xl font-bold tracking-tight text-slate-950">See what’s paid and what’s still due</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-700">
            In Billing, each invoice has a payment status. Filter your list to view paid or unpaid invoices, and mark an invoice paid when you receive payment (or unpaid if its status needs correcting). The Overview also summarizes invoices awaiting payment so you can keep an eye on outstanding amounts.
          </p>
          <Link to="/billing" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800">
            Track invoice payments
          </Link>
        </section>

      </main>
    </div>
  );
};

export default Info;
