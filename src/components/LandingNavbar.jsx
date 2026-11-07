import { useState } from 'react';
import { FileText, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const LandingNavbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollTo = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600">
            <FileText size={18} className="text-white" />
          </span>
          <span className="text-sm font-semibold tracking-tight text-white">KeelBill Ledger</span>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden items-center gap-8 md:flex">
          <button
            onClick={() => scrollTo('features')}
            className="text-sm text-slate-300 transition hover:text-white"
          >
            Features
          </button>
          <button
            onClick={() => scrollTo('contact')}
            className="text-sm text-slate-300 transition hover:text-white"
          >
            Contact
          </button>
          <Link
            to="/login"
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            Login
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 md:hidden hover:text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-800 px-6 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <button
              onClick={() => scrollTo('features')}
              className="rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              Features
            </button>
            <button
              onClick={() => scrollTo('contact')}
              className="rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              Contact
            </button>
            <Link
              to="/login"
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-emerald-500"
            >
              Login
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default LandingNavbar;
