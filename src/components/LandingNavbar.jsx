import { useState } from 'react';
import { ArrowRight, FileText, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const LandingNavbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollTo = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
      element.scrollIntoView({ behavior });
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-[#e7dfd8] bg-[#f8f4f0]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8 lg:px-10">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00605d] text-[#c5f1e7]">
            <FileText size={18} className="text-white" />
          </span>
          <span>
            <span className="block text-sm font-semibold tracking-tight text-[#1a1a1a]">KeelBill Ledger</span>
            <span className="mt-0.5 block text-[10px] font-medium tracking-wide text-[#555555]">Billing workspace</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <button
            onClick={() => scrollTo('features')}
            className="text-sm font-medium text-[#555555] transition hover:text-[#00605d]"
          >
            Features
          </button>
          <button
            onClick={() => scrollTo('contact')}
            className="text-sm font-medium text-[#555555] transition hover:text-[#00605d]"
          >
            Contact
          </button>
          <Link
            to="/login"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#00605d] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#004d4a]"
          >
            Get started
            <ArrowRight size={15} />
          </Link>
        </div>

        <button
          className="flex h-11 w-11 items-center justify-center rounded-xl text-[#1a1a1a] transition hover:bg-white md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-[#e7dfd8] bg-[#f8f4f0] px-5 py-4 sm:px-8 md:hidden">
          <div className="flex flex-col gap-3">
            <button
              onClick={() => scrollTo('features')}
              className="rounded-lg px-3 py-3 text-left text-sm text-[#555555] transition hover:bg-white hover:text-[#00605d]"
            >
              Features
            </button>
            <button
              onClick={() => scrollTo('contact')}
              className="rounded-lg px-3 py-3 text-left text-sm text-[#555555] transition hover:bg-white hover:text-[#00605d]"
            >
              Contact
            </button>
            <Link
              to="/login"
              className="rounded-xl bg-[#00605d] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#004d4a]"
            >
              Get started
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default LandingNavbar;
