import {
  ArrowRight,
  FileText,
  LayoutDashboard,
  Package,
  Receipt,
  Users,
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
    icon: FileText,
  },
  {
    title: 'Keep billing organized',
    description: 'Review invoices, filter by payment status, and update an invoice when a customer pays.',
    to: '/billing',
    label: 'Open billing',
    icon: Receipt,
  },
  {
    title: 'Manage customers and products',
    description: 'Save customer and product details so they are ready to use in future documents.',
    to: '/customers',
    label: 'Manage customers',
    icon: Users,
  },
];

const Info = () => {
  const { logout, user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header onLogout={logout} user={user} />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[28px] bg-slate-950 px-6 py-10 text-white shadow-soft sm:px-10 sm:py-14">
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">About Ledger</p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Your billing work, in one place.</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
              Ledger helps you prepare quotations and invoices, keep useful business details close at hand, and stay on top of your billing workflow.
            </p>
            <Link to="/" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500">
              <LayoutDashboard size={16} /> Go to overview <ArrowRight size={15} />
            </Link>
          </div>
        </section>

        <section className="mt-8 grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 md:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700">About Ledger</p>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950">A simpler way to handle everyday billing</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Ledger is a business document workspace for preparing quotations and invoices. Keep your company profile, customer records, and product catalog together, then use those details to build clear documents and download them as PDFs.
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Whether you are drafting a quote or recording a sale, Ledger brings the key steps into one place: enter the details, review totals, and save a document you can share with your customer.
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
          <div className="grid gap-4 md:grid-cols-3">
            {workflows.map(({ title, description, to, label, icon: Icon }) => (
              <article key={title} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Icon size={20} />
                </span>
                <h3 className="mt-5 text-base font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{description}</p>
                <Link to={to} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800">
                  {label} <ArrowRight size={15} />
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-800">Payment tracking</p>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950">See what’s paid and what’s still due</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-700">
            In Billing, each invoice has a payment status. Filter your list to view paid or unpaid invoices, and mark an invoice paid when you receive payment (or unpaid if its status needs correcting). The Overview also summarizes invoices awaiting payment so you can keep an eye on outstanding amounts.
          </p>
          <Link to="/billing" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800">
            Track invoice payments <ArrowRight size={15} />
          </Link>
        </section>

      </main>
    </div>
  );
};

export default Info;
