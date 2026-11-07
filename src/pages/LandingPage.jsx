import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BadgeIndianRupee,
  Boxes,
  FileCheck2,
  FileText,
  PackageCheck,
  ReceiptText,
  ShoppingBasket,
  Truck,
} from 'lucide-react';
import { useAuth } from '../context/useAuth';
import LandingNavbar from '../components/LandingNavbar';
import LandingProductPreview from '../components/LandingProductPreview';
import ContactForm from '../components/ContactForm';
import quotationPreview from '../assets/images/quotation.png';
import posPreview from '../assets/images/pos-preview.jpg';
import challanPreview from '../assets/images/delivery-challan-preview.jpg';

const services = [
  {
    id: 'quotations',
    title: 'Quotations that are ready to share',
    description: 'Build clear, itemized quotations with customer details, pricing, and GST in one document.',
    image: quotationPreview,
    imageAlt: 'Sample quotation with company and customer details, itemized pricing, GST, and total',
    icon: FileCheck2,
  },
  {
    id: 'point-of-sale',
    title: 'Point of sale for the counter',
    description: 'See sales activity, top-selling products, and payment breakdowns from your POS workspace.',
    image: posPreview,
    imageAlt: 'KeelBill Ledger point-of-sale dashboard with sales overview, top-selling products, and payment breakdown',
    icon: ShoppingBasket,
  },
  {
    id: 'delivery-challans',
    title: 'Delivery challans for dispatch',
    description: 'Record consignor and consignee details, packing information, and dispatch particulars in a print-ready challan.',
    image: challanPreview,
    imageAlt: 'Sample delivery challan showing consignor, consignee, packing, dispatch details, and totals',
    icon: Truck,
  },
];

const scrollToSection = (id) => {
  const element = document.getElementById(id);
  if (!element) return;
  const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  element.scrollIntoView({ behavior });
};

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f4f0]">
        <div className="rounded-2xl border border-[#e7dfd8] bg-white px-6 py-8">
          <p className="text-sm text-[#555555]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-page min-h-screen overflow-hidden bg-[#f8f4f0] text-[#1a1a1a]">
      <style>{`
        .landing-page {
          --ledger-cream: #f8f4f0;
          --ledger-teal: #00605d;
          --ledger-mint: #1abc9c;
          --ledger-ink: #1a1a1a;
          --ledger-muted: #555555;
          --ledger-line: #e7dfd8;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        .landing-page ::selection { background: #bcece2; color: #003f3d; }
        .landing-page :focus-visible { outline: 3px solid #1abc9c; outline-offset: 3px; }
        .landing-page .flow-step:hover .flow-icon { transform: translateY(-3px); background: #00605d; color: white; }
        .landing-page .flow-icon { transition: transform 220ms ease, background-color 220ms ease, color 220ms ease; }
        @media (prefers-reduced-motion: reduce) {
          .landing-page *, .landing-page *::before, .landing-page *::after {
            scroll-behavior: auto !important;
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      <LandingNavbar />

      <main>
        <section className="relative px-5 pb-12 pt-12 sm:px-8 sm:pb-16 sm:pt-16 lg:px-10 lg:pb-20 lg:pt-20">
          <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:gap-14">
            <div className="relative z-10 max-w-xl">
              <h1 className="max-w-[15ch] text-4xl font-semibold leading-[1.08] tracking-[-0.035em] text-[#1a1a1a]">
                Quotes, invoices, and delivery challans — without re-entering details.
              </h1>
              <p className="mt-6 max-w-[58ch] text-base leading-7 text-[#555555] sm:text-lg sm:leading-8">
                Save customer and product details once, then use them to create professional business documents and keep everyday sales in one workspace.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => navigate('/login')}
                  className="group inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-[#00605d] px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(0,96,93,0.16)] transition hover:bg-[#004d4a] active:translate-y-px"
                >
                  Get Started
                  <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
                </button>
                <button
                  onClick={() => scrollToSection('features')}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#cfc5bc] bg-transparent px-5 py-3 text-sm font-semibold text-[#1a1a1a] transition hover:border-[#00605d] hover:bg-white/70"
                >
                  Explore the workspace
                  <ArrowDown size={15} />
                </button>
              </div>

              <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-[#e7dfd8] pt-5 text-xs font-medium text-[#555555]">
                <span className="inline-flex items-center gap-2"><BadgeIndianRupee size={16} className="text-[#00605d]" />GST-ready documents</span>
                <span className="inline-flex items-center gap-2"><Boxes size={16} className="text-[#00605d]" />Saved customers & products</span>
              </div>
            </div>

            <div className="min-w-0">
              <LandingProductPreview />
            </div>
          </div>

          <div className="mx-auto mt-12 max-w-7xl border-t border-[#e7dfd8] pt-7 sm:mt-16 lg:mt-20">
            <div className="grid gap-5 sm:grid-cols-[minmax(150px,0.7fr)_repeat(3,minmax(0,1fr))] sm:items-center sm:gap-4">
              <div className="max-w-[15ch]">
                <p className="text-sm font-semibold text-[#1a1a1a]">One set of details.</p>
                <p className="mt-1 text-sm leading-5 text-[#555555]">Ready across your workflow.</p>
              </div>
              {[
                { label: 'CUSTOMER & PRODUCTS', Icon: FileText },
                { label: 'QUOTATIONS & INVOICES', Icon: ReceiptText },
                { label: 'SALES & DISPATCH', Icon: PackageCheck },
              ].map(({ label, Icon }, index) => (
                <div className="flow-step flex items-center gap-3" key={label}>
                  <span className="flow-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e1f3ed] text-[#00605d]">
                    <Icon size={18} strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold tracking-[0.12em] text-[#555555]">{label}</p>
                    <div className="mt-2 flex items-center gap-1" aria-hidden="true">
                      <span className="h-1 w-1 rounded-full bg-[#1abc9c]" />
                      <span className="h-px w-8 bg-[#a7d7ca]" />
                      <span className="h-1 w-1 rounded-full bg-[#1abc9c]" />
                    </div>
                  </div>
                  {index < 2 && <ArrowRight size={15} className="ml-auto hidden text-[#78bdae] sm:block" aria-hidden="true" />}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="scroll-mt-24 bg-white px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-5 border-b border-[#e7dfd8] pb-8 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <h2 className="max-w-[17ch] text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#1a1a1a] sm:text-4xl">
                  Everything you need for the next sale.
                </h2>
                <p className="mt-3 max-w-[60ch] text-base leading-7 text-[#555555]">
                  Explore the document and sales workflows in KeelBill Ledger.
                </p>
              </div>
              <span className="hidden pb-1 text-xs font-semibold tracking-[0.14em] text-[#00605d] sm:inline">MADE FOR DAILY BUSINESS</span>
            </div>

            <div className="mt-3">
              {services.map((service, index) => {
                const Icon = service.icon;
                return (
                  <article
                    key={service.id}
                    className={`grid items-center gap-8 border-b border-[#e7dfd8] py-10 sm:py-12 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16 lg:py-16 ${
                      index % 2 ? 'lg:[&>div:first-child]:order-2' : ''
                    }`}
                  >
                    <div className="max-w-md">
                      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-[#e1f3ed] text-[#00605d]">
                        <Icon size={20} strokeWidth={1.8} />
                      </div>
                      <h3 className="text-xl font-semibold leading-tight tracking-[-0.025em] text-[#1a1a1a] sm:text-[22px]">
                        {service.title}
                      </h3>
                      <p className="mt-4 max-w-[56ch] text-base leading-7 text-[#555555]">
                        {service.description}
                      </p>
                      {index === 0 && (
                        <button
                          onClick={() => navigate('/login')}
                          className="group mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#00605d] hover:text-[#004d4a]"
                        >
                          Create your first document
                          <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </button>
                      )}
                    </div>
                    <figure className="overflow-hidden rounded-2xl border border-[#e7dfd8] bg-[#f8f4f0] p-2 sm:p-3">
                      <img
                        src={service.image}
                        alt={service.imageAlt}
                        className="block h-auto max-h-[28rem] w-full rounded-xl object-contain object-center"
                        loading="lazy"
                      />
                    </figure>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="contact" className="scroll-mt-24 bg-[#f8f4f0] px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 max-w-xl">
              <h2 className="text-3xl font-semibold tracking-[-0.03em] text-[#1a1a1a] sm:text-4xl">Let’s make billing simpler.</h2>
              <p className="mt-3 text-base leading-7 text-[#555555]">
                Have a question, need a demo, or want to discuss your requirements? We are here to help.
              </p>
            </div>
            <ContactForm />
          </div>
        </section>
      </main>

      <footer className="bg-[#004d4a] px-5 py-8 text-white sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 sm:flex-row">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-[#a6e5d7]">
              <FileText size={18} />
            </span>
            <span className="text-sm font-semibold">KeelBill Ledger</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/75">
            <button onClick={() => scrollToSection('features')} className="transition hover:text-white">Features</button>
            <button onClick={() => scrollToSection('contact')} className="transition hover:text-white">Contact</button>
            <button onClick={() => navigate('/login')} className="font-semibold text-[#a6e5d7] transition hover:text-white">Login</button>
          </div>
          <p className="text-xs text-white/60">&copy; {new Date().getFullYear()} KeelBill. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
