import { ArrowUpRight, FileText, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const AuthLayout = ({ eyebrow, title, description, children }) => (
  <main className="auth-layout min-h-screen bg-white lg:grid lg:grid-cols-[1.05fr_0.95fr]">
    <style>{`
      .auth-layout ::selection { background: #d1fae5; color: #065f46; }
      .auth-layout ::-moz-selection { background: #d1fae5; color: #065f46; }
      .auth-layout ::-webkit-scrollbar { width: 8px; height: 8px; }
      .auth-layout ::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
      .auth-layout ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      .auth-layout ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
    `}</style>
    <aside className="relative hidden min-h-screen overflow-hidden bg-slate-950 px-12 py-10 text-white lg:flex lg:flex-col xl:px-16">
      <div className="absolute -right-32 -top-24 h-96 w-96 rounded-full border border-white/10" />
      <div className="absolute -right-10 -top-2 h-96 w-96 rounded-full border border-white/10" />
      <div className="absolute -bottom-52 -left-28 h-[480px] w-[480px] rounded-full bg-emerald-500/10 blur-3xl" />
      <Link to="/" className="relative flex w-fit items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600">
          <FileText size={20} />
        </span>
        <span className="text-base font-semibold tracking-tight">KeelBill Ledger</span>
      </Link>

      <div className="relative my-auto max-w-xl py-16">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-emerald-200">
          <ShieldCheck size={14} />
          Your business, beautifully organised
        </span>
        <h2 className="mt-7 text-5xl font-semibold leading-[1.12] tracking-tight xl:text-[58px]">
          Make every invoice feel like your best work.
        </h2>
        <p className="mt-6 max-w-md text-[15px] leading-7 text-slate-300">
          One thoughtful workspace for your customers, products, quotations and billing. Create professional documents and keep your business moving.
        </p>

        <div className="mt-12 max-w-md rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-400">A clear view of your business</p>
              <p className="mt-2 text-sm font-semibold">Every detail, right where you need it.</p>
            </div>
            <ArrowUpRight size={17} className="text-emerald-300" />
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/10 pt-4">
            {[
              ['Documents', 'In one place'],
              ['Customers', 'Always close'],
              ['Your details', 'Ready to reuse'],
            ].map(([label, detail]) => (
              <div key={label}>
                <p className="text-[11px] font-semibold text-white">{label}</p>
                <p className="mt-1 text-[10px] text-slate-400">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="relative text-xs text-slate-400">Professional billing and quotations, made simple.</p>
      <p className="relative text-xs text-slate-400">KeelBill Ledger</p>
    </aside>

    <section className="flex min-h-screen flex-col bg-[#f8f9fb] px-4 py-6 sm:px-8 lg:items-center lg:justify-center lg:bg-white lg:px-12 lg:py-12">
      <div className="mb-10 flex items-center gap-3 lg:hidden">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
          <FileText size={19} />
        </span>
        <span className="text-base font-bold tracking-tight text-slate-950">KeelBill Ledger</span>
      </div>
      <div className="mx-auto w-full max-w-[440px]">
        {eyebrow ? (
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">{eyebrow}</p>
        ) : null}
        <h1 className={`${eyebrow ? 'mt-2' : 'mt-3'} text-3xl font-semibold tracking-tight text-slate-950`}>{title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
        <div className="mt-8">{children}</div>
        <p className="mt-8 text-center text-xs leading-5 text-slate-400">
          By continuing, you agree to use this workspace in accordance with your organisation’s policies.
        </p>
      </div>
    </section>
  </main>
);

export default AuthLayout;
