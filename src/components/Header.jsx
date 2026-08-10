import { FileText, RotateCcw } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useState } from 'react';

const Header = ({ onGeneratePdf, onPreviewPdf, onReset, onLogout, isSubmitting, documentMode, onSetDocumentMode, user }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinkClass = ({ isActive }) =>
    `rounded-xl px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-brand-600 text-white shadow-soft' : 'text-slate-600 hover:text-brand-600'}`;

  return (
    <header className="sticky top-0 z-20 mb-6 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-soft">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">GIBBSSOFT</p>
            <p className="text-sm text-slate-500">Billing & Invoicing Solutions</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="hidden md:flex items-center gap-2">
            <NavLink to="/" className={navLinkClass} end>
              Home
            </NavLink>
            <NavLink to="/customers" className={navLinkClass}>
              Customers
            </NavLink>
            <NavLink to="/products" className={navLinkClass}>
              Products
            </NavLink>
            <NavLink to="/quotations" className={navLinkClass}>
              Quotations
            </NavLink>
          </div>

          {onSetDocumentMode ? (
            <>
              <div className="flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => onSetDocumentMode('quotation')}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${documentMode === 'quotation' ? 'bg-brand-600 text-white shadow-soft' : 'text-slate-600 hover:text-brand-600'}`}
                >
                  Quotation
                </button>
                <button
                  type="button"
                  onClick={() => onSetDocumentMode('billing')}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${documentMode === 'billing' ? 'bg-brand-600 text-white shadow-soft' : 'text-slate-600 hover:text-brand-600'}`}
                >
                  Billing
                </button>
              </div>
              <button
                type="button"
                onClick={onPreviewPdf}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-brand-500 hover:text-brand-600"
              >
                Preview PDF
              </button>
              <button
                type="button"
                onClick={onGeneratePdf}
                disabled={isSubmitting}
                className="rounded-2xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                Generate PDF
              </button>
              <button
                type="button"
                onClick={onReset}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-rose-300 hover:text-rose-600"
              >
                <span className="flex items-center gap-2">
                  <RotateCcw size={16} />
                  Reset
                </span>
              </button>
            </>
          ) : null}

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-medium border border-slate-200 hover:shadow-sm"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white">
                {user && user.name ? user.name.split(' ').map(n=>n[0]).slice(0,2).join('') : 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-semibold text-slate-900">{user?.name || 'User'}</div>
                <div className="text-xs text-slate-500">{user?.email || ''}</div>
              </div>
            </button>

            {menuOpen ? (
              <div className="absolute right-0 mt-2 w-48 rounded-lg border border-slate-200 bg-white shadow-lg">
                <div className="px-4 py-3">
                  <div className="text-sm font-medium text-slate-900">{user?.name || 'User'}</div>
                  <div className="text-xs text-slate-500">{user?.email || ''}</div>
                </div>
                <div className="border-t border-slate-100" />
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); onLogout && onLogout(); }}
                  className="w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                >
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
