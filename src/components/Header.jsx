import { useState } from 'react';
import {
  ArrowDownToLine,
  Bell,
  ChevronDown,
  FileText,
  LayoutDashboard,
  Menu,
  Package,
  Plus,
  Receipt,
  RotateCcw,
  Users,
  X,
} from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';

const navigation = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/new', label: 'Create document', icon: Plus },
  { to: '/billing', label: 'Billing', icon: Receipt },
  { to: '/quotations', label: 'Quotations', icon: FileText },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/products', label: 'Products', icon: Package },
];

const Header = ({
  onDownloadPdf,
  onReset,
  onLogout,
  isSubmitting,
  documentMode,
  onSetDocumentMode,
  user,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const displayName = user?.username || user?.name || 'Account';
  const initials = displayName
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-medium transition ${
      isActive ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
    }`;

  const renderNavigation = (onNavigate) => (
    <>
      {navigation.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={navLinkClass}
        >
          <Icon size={16} strokeWidth={1.8} />
          {label}
        </NavLink>
      ))}
    </>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-3" aria-label="Ledger home">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
            <Receipt size={20} strokeWidth={2} />
          </span>
          <span>
            <span className="block text-[15px] font-bold tracking-tight text-slate-950">Ledger</span>
            <span className="hidden text-[11px] text-slate-500 sm:block">Billing workspace</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 xl:flex" aria-label="Main navigation">
          {renderNavigation()}
        </nav>

        {onSetDocumentMode ? (
          <div className="hidden items-center gap-2 lg:flex">
            <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
              {['quotation', 'billing'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onSetDocumentMode(mode)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                    documentMode === mode ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {mode === 'billing' ? 'Invoice' : 'Quotation'}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={onDownloadPdf}
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ArrowDownToLine size={14} />
              {isSubmitting ? 'Saving & preparing…' : `Download ${documentMode === 'billing' ? 'Invoice' : 'Quotation'}`}
            </button>
            <button
              type="button"
              onClick={onReset}
              aria-label="Clear document"
              className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <RotateCcw size={15} />
            </button>
          </div>
        ) : null}

        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-500 sm:flex">
            <Bell size={17} strokeWidth={1.7} />
          </span>
          <div className="relative">
            <button
              type="button"
              aria-expanded={accountOpen}
              onClick={() => setAccountOpen((open) => !open)}
              className="flex items-center gap-2 rounded-xl p-1.5 text-left transition hover:bg-slate-50"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
                {initials || 'AC'}
              </span>
              <span className="hidden max-w-[125px] sm:block">
                <span className="block truncate text-xs font-semibold text-slate-800">{displayName}</span>
                <span className="block truncate text-[11px] text-slate-500">{user?.email || 'Signed in'}</span>
              </span>
              <ChevronDown size={14} className="hidden text-slate-400 sm:block" />
            </button>
            {accountOpen ? (
              <div className="absolute right-0 top-12 z-40 w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                <div className="border-b border-slate-100 px-3 py-2">
                  <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
                  <p className="truncate text-xs text-slate-500">{user?.email || ''}</p>
                  {user?.role ? <p className="mt-1 text-xs text-emerald-700">{user.role}</p> : null}
                  {user?.mobile_number ? <p className="mt-1 text-xs text-slate-500">{user.mobile_number}</p> : null}
                </div>
                <Link
                  to="/profile"
                  onClick={() => setAccountOpen(false)}
                  className="mt-1 block w-full rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  My profile
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setAccountOpen(false);
                    onLogout?.();
                  }}
                  className="mt-1 w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                >
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 xl:hidden"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
      {menuOpen ? (
        <nav className="grid grid-cols-2 gap-1 border-t border-slate-100 px-4 py-3 xl:hidden" aria-label="Mobile navigation">
          {renderNavigation(() => setMenuOpen(false))}
          {onSetDocumentMode ? (
            <div className="col-span-2 flex gap-2 pt-2">
              <button
                type="button"
                onClick={onDownloadPdf}
                disabled={isSubmitting}
                className="flex-1 rounded-xl bg-emerald-700 px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isSubmitting ? 'Saving & preparing…' : `Download ${documentMode === 'billing' ? 'Invoice' : 'Quotation'}`}
              </button>
            </div>
          ) : null}
        </nav>
      ) : null}
    </header>
  );
};

export default Header;
