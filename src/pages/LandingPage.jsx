import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
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
  },
  {
    id: 'point-of-sale',
    title: 'Point of sale for the counter',
    description: 'See sales activity, top-selling products, and payment breakdowns from your POS workspace.',
    image: posPreview,
    imageAlt: 'KeelBill Ledger point-of-sale dashboard with sales overview, top-selling products, and payment breakdown',
  },
  {
    id: 'delivery-challans',
    title: 'Delivery challans for dispatch',
    description: 'Record consignor and consignee details, packing information, and dispatch particulars in a print-ready challan.',
    image: challanPreview,
    imageAlt: 'Sample delivery challan showing consignor, consignee, packing, dispatch details, and totals',
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
        .landing-page h1,
        .landing-page h2,
        .landing-page h3 {
          font-family: Lora, Georgia, 'Times New Roman', serif;
        }
        .landing-page ::selection { background: #bcece2; color: #003f3d; }
        .landing-page :focus-visible { outline: 3px solid #1abc9c; outline-offset: 3px; }
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
                  className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[#00605d] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#004d4a] active:translate-y-px"
                >
                  Get Started
                </button>
                <button
                  onClick={() => scrollToSection('features')}
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[#cfc5bc] bg-transparent px-5 py-3 text-sm font-semibold text-[#1a1a1a] transition hover:border-[#00605d] hover:bg-white/70"
                >
                  Explore the workspace
                </button>
              </div>

              <p className="mt-9 border-t border-[#e7dfd8] pt-5 text-xs font-medium text-[#555555]">
                GST-ready documents · Saved customers &amp; products
              </p>
            </div>

            <div className="min-w-0">
              <LandingProductPreview />
            </div>
          </div>

          <div className="mx-auto mt-12 max-w-7xl border-t border-[#e7dfd8] pt-7 sm:mt-16 lg:mt-20">
            <p className="text-sm leading-7 text-[#555555]">
              <span className="font-semibold text-[#1a1a1a]">Keep the details once.</span> Save customers and products for reuse.
              <span className="mx-3 text-[#cfc5bc]">|</span>
              <span className="font-semibold text-[#1a1a1a]">Prepare the paperwork.</span> Create quotations, invoices, and delivery challans.
              <span className="mx-3 text-[#cfc5bc]">|</span>
              <span className="font-semibold text-[#1a1a1a]">Follow the work through.</span> Review sales and dispatch from the same workspace.
            </p>
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
            </div>

            <div className="mt-3">
              {services.map((service, index) => {
                return (
                  <article
                    key={service.id}
                    className={`grid items-center gap-8 border-b border-[#e7dfd8] py-10 sm:py-12 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16 lg:py-16 ${
                      index % 2 ? 'lg:[&>div:first-child]:order-2' : ''
                    }`}
                  >
                    <div className="max-w-md">
                      <h3 className="text-xl font-semibold leading-tight tracking-[-0.025em] text-[#1a1a1a] sm:text-[22px]">
                        {service.title}
                      </h3>
                      <p className="mt-4 max-w-[56ch] text-base leading-7 text-[#555555]">
                        {service.description}
                      </p>
                      {index === 0 && (
                        <button
                          onClick={() => navigate('/login')}
                          className="mt-6 text-sm font-semibold text-[#00605d] underline decoration-[#00605d]/30 underline-offset-4 hover:decoration-[#00605d]"
                        >
                          Create your first document
                        </button>
                      )}
                    </div>
                    <figure className="overflow-hidden rounded-lg border border-[#e7dfd8] bg-[#f8f4f0] p-2 sm:p-3">
                      <img
                        src={service.image}
                        alt={service.imageAlt}
                        className="block h-auto max-h-[28rem] w-full rounded-md object-contain object-center"
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
          <div className="flex items-center gap-2">
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
