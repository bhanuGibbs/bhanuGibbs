import {
  ArrowUpRight,
  BadgeCheck,
  FileCheck2,
  FileText,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
  ShoppingBasket,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AuthLayout = ({ eyebrow, title, description, children, variant = 'default' }) => {
  const isAuth = variant === 'auth';

  return (
    <main className={`auth-layout min-h-screen ${isAuth ? 'bg-[#f8fafc] xl:min-h-0 xl:grid xl:grid-cols-2 xl:gap-5 xl:p-5 2xl:gap-7 2xl:p-7' : 'bg-white lg:grid lg:grid-cols-[1.05fr_0.95fr]'}`}>
      <style>{`
        .auth-layout ::selection { background: #d1fae5; color: #065f46; }
        .auth-layout ::-moz-selection { background: #d1fae5; color: #065f46; }
        .auth-layout ::-webkit-scrollbar { width: 8px; height: 8px; }
        .auth-layout ::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
        .auth-layout ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .auth-layout ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .auth-layout :focus-visible { outline: 3px solid #10b981; outline-offset: 3px; }
        @media (prefers-reduced-motion: reduce) {
          .auth-layout *, .auth-layout *::before, .auth-layout *::after {
            scroll-behavior: auto !important;
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
      <aside className={`relative hidden overflow-hidden px-12 py-10 text-white ${isAuth ? 'min-h-[calc(100vh-2.5rem)] rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 xl:flex xl:flex-col 2xl:px-16' : 'min-h-screen bg-slate-950 lg:flex lg:flex-col xl:px-16'}`}>
        {!isAuth ? (
          <>
            <div className="absolute -right-32 -top-24 h-96 w-96 rounded-full border border-white/10" />
            <div className="absolute -right-10 -top-2 h-96 w-96 rounded-full border border-white/10" />
            <div className="absolute -bottom-52 -left-28 h-[480px] w-[480px] rounded-full bg-emerald-500/10 blur-3xl" />
          </>
        ) : null}
        <Link to="/landing" className="relative flex w-fit items-center gap-3">
          <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${isAuth ? 'bg-emerald-500 text-white' : 'bg-emerald-600'}`}>
            <FileText size={20} />
          </span>
          <span className="text-base font-semibold tracking-tight">KeelBill Ledger</span>
        </Link>

        {isAuth ? (
          <div className="relative my-auto mx-auto w-full max-w-xl py-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold text-emerald-100">
              <ShieldCheck size={14} />
              BUILT FOR EVERYDAY BILLING
            </span>
            <h2 className="mt-7 max-w-[13ch] text-4xl font-semibold leading-[1.08] tracking-[-0.03em] 2xl:text-5xl">
              Your business, in one clear view.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-200">
              Create GST-ready documents, keep customer and product details close, and follow your sales from one workspace.
            </p>

            <div className="relative mt-10 rounded-2xl border border-white/15 bg-slate-950/45 p-5 shadow-2xl shadow-black/20 sm:p-6">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <p className="text-xs font-medium text-slate-300">KEELBILL LEDGER</p>
                  <p className="mt-1 text-sm font-semibold text-white">Your billing workspace</p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-200">
                  <ReceiptText size={20} />
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {[
                  { Icon: FileCheck2, name: 'Quotations', detail: 'Customer details ready to reuse', tone: 'text-emerald-200' },
                  { Icon: ReceiptText, name: 'Invoices', detail: 'GST breakdown, clearly shown', tone: 'text-teal-200' },
                  { Icon: ShoppingBasket, name: 'Sales & products', detail: 'Your daily activity in one place', tone: 'text-sky-200' },
                ].map(({ Icon, name, detail, tone }) => (
                  <div key={name} className="flex items-center gap-3 rounded-xl bg-white/[0.06] px-3 py-3">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.08] ${tone}`}>
                      <Icon size={17} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white">{name}</p>
                      <p className="mt-0.5 text-xs leading-5 text-slate-300">{detail}</p>
                    </div>
                    <ArrowUpRight size={16} className="shrink-0 text-emerald-200" aria-hidden="true" />
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] px-3 py-1.5 text-xs font-medium text-slate-100">
                  <BadgeCheck size={14} className="text-emerald-300" />
                  GST-ready documents
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] px-3 py-1.5 text-xs font-medium text-slate-100">
                  <LockKeyhole size={13} className="text-emerald-300" />
                  Secure account
                </span>
              </div>
            </div>
          </div>
        ) : (
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
        )}
        {isAuth ? (
          <p className="relative text-xs text-slate-300">Professional billing and quotations, made simple.</p>
        ) : (
          <>
            <p className="relative text-xs text-slate-400">Professional billing and quotations, made simple.</p>
            <p className="relative text-xs text-slate-400">KeelBill Ledger</p>
          </>
        )}
      </aside>

      <section className={`flex min-h-screen flex-col px-4 py-6 sm:px-8 lg:px-12 lg:py-12 ${isAuth ? 'items-center justify-center bg-[#f8fafc] sm:py-10 xl:min-h-0 xl:bg-transparent xl:px-5 xl:py-0 2xl:px-12' : 'bg-[#f8f9fb] lg:items-center lg:justify-center lg:bg-white'}`}>
        <div className={`mb-8 flex items-center gap-3 ${isAuth ? 'xl:hidden' : 'mb-10 lg:hidden'}`}>
          <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-white ${isAuth ? 'bg-emerald-700' : 'bg-slate-950'}`}>
            <FileText size={19} />
          </span>
          <span className="text-base font-bold tracking-tight text-slate-950">KeelBill Ledger</span>
        </div>
        <div className={`mx-auto w-full max-w-[440px] ${isAuth ? 'rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xl shadow-slate-900/[0.08] sm:p-8 xl:max-w-[480px] xl:p-8' : ''}`}>
          {eyebrow ? (
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">{eyebrow}</p>
          ) : null}
          <h1 className={`${eyebrow ? 'mt-2' : 'mt-3'} text-3xl font-semibold tracking-tight text-slate-950`}>{title}</h1>
          <p className={`mt-2 text-sm leading-6 ${isAuth ? 'text-slate-700' : 'text-slate-500'}`}>{description}</p>
          <div className={isAuth ? 'mt-7' : 'mt-8'}>{children}</div>
          <p className={`mt-7 text-center text-xs leading-5 ${isAuth ? 'text-slate-600' : 'text-slate-400'}`}>
            By continuing, you agree to use this workspace in accordance with your organisation’s policies.
          </p>
        </div>
      </section>
    </main>
  );
};

export default AuthLayout;
