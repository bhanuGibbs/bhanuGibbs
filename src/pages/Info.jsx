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
    <div className="info-page min-h-screen bg-[#F8F9FA] text-[#2D3748]">
      <style>{`
        .info-page ::selection { background: #ffedd5; color: #9a3412; }
        .info-page ::-moz-selection { background: #ffedd5; color: #9a3412; }
        .info-page ::-webkit-scrollbar { width: 8px; height: 8px; }
        .info-page ::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
        .info-page ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .info-page ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
      <Header onLogout={logout} user={user} />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-xl bg-[#1E3A5F] px-6 py-10 text-white shadow-card-md sm:px-10 sm:py-14">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Your billing work, in one place.</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-blue-100">
              Ledger helps you prepare quotations and invoices, keep useful business details close at hand, and stay on top of your billing workflow.
            </p>
            <Link to="/" className="mt-7 inline-flex items-center gap-2 rounded-lg bg-[#FF6B35] px-4 py-2.5 text-sm font-semibold text-white shadow-cta transition hover:bg-[#e55a28]">
              <LayoutDashboard size={16} /> Go to overview
            </Link>
          </div>
        </section>

        <section className="mt-8 grid gap-6 rounded-xl border border-[#1E3A5F]/10 bg-white p-6 shadow-card-sm sm:p-8 md:grid-cols-[1.3fr_1fr]">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#1E3A5F]">A simpler way to handle everyday billing</h2>
            <p className="mt-3 text-sm leading-7 text-[#2D3748]">
              Ledger is a business document workspace for preparing quotations and invoices. Keep your company profile, customer records, and product catalog together, then use those details to build clear documents and download them as PDFs.
            </p>
            <p className="mt-3 text-sm leading-7 text-[#2D3748]">
              Start with a customer and products already in your workspace, then enter quantities, prices, GST, and terms. Review the totals before saving the document as a PDF.
            </p>
          </div>
          <div className="rounded-xl bg-[#1E3A5F]/5 p-5">
            <h3 className="font-semibold text-[#1E3A5F]">Built for your workflow</h3>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-[#2D3748]">
              <li><span className="font-semibold text-[#1E3A5F]">Reusable business details:</span> keep company, customer, and product information ready.</li>
              <li><span className="font-semibold text-[#1E3A5F]">Flexible documents:</span> include line items, discounts, taxes, shipping, terms, and a signature.</li>
              <li><span className="font-semibold text-[#1E3A5F]">PDF output:</span> review and download a shareable copy of your document.</li>
            </ul>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-5">
            <h2 className="text-xl font-bold tracking-tight text-[#1E3A5F]">What you can do</h2>
            <p className="mt-1 text-sm text-[#2D3748]">A quick guide to the main parts of your workspace.</p>
          </div>
          <div className="grid gap-x-8 gap-y-6 md:grid-cols-3">
            {workflows.map(({ title, description, to, label }) => (
              <article key={title} className="flex flex-col border-t border-[#1E3A5F]/10 pt-5">
                <h3 className="text-base font-semibold text-[#1E3A5F]">{title}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-[#2D3748]">{description}</p>
                <Link to={to} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#FF6B35] underline hover:text-[#e55a28]">
                  {label}
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-xl border border-[#FF6B35]/20 bg-orange-50/70 p-6 shadow-card-sm sm:p-8">
          <h2 className="text-xl font-bold tracking-tight text-[#1E3A5F]">See what's paid and what's still due</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#2D3748]">
            In Billing, each invoice has a payment status. Filter your list to view paid or unpaid invoices, and mark an invoice paid when you receive payment (or unpaid if its status needs correcting). The Overview also summarizes invoices awaiting payment so you can keep an eye on outstanding amounts.
          </p>
          <Link to="/billing" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#FF6B35] px-4 py-2.5 text-sm font-semibold text-white shadow-cta transition hover:bg-[#e55a28]">
            Track invoice payments
          </Link>
        </section>

      </main>
    </div>
  );
};

export default Info;
