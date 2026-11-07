import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { ArrowRight, FileText } from 'lucide-react';
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

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  // Show nothing while checking auth; authenticated users are redirected above
  if (loading || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-8 shadow-soft">
          <p className="text-sm text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <LandingNavbar />

      <section className="border-b border-slate-200 bg-slate-50 px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-5xl">
              Quotes, invoices, and delivery challans — without re-entering details.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
              Save customer and product details once, then use them to create professional business documents and keep everyday sales in one workspace.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => navigate('/login')}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                Get Started
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById('features');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Explore the workspace
              </button>
            </div>
          </div>

          <LandingProductPreview />
        </div>
      </section>

      <section id="features" className="scroll-mt-20 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Tools for the work you do every day
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Explore the document and sales workflows in KeelBill Ledger.
            </p>
          </div>

          <div className="mt-10">
            {services.map((service, index) => (
              <article
                key={service.id}
                className={`grid items-center gap-8 border-t border-slate-200 py-10 lg:grid-cols-2 lg:gap-14 lg:py-14 ${
                  index % 2 ? 'lg:[&>div:first-child]:order-2' : ''
                }`}
              >
                <div>
                  <h3 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                    {service.title}
                  </h3>
                  <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
                    {service.description}
                  </p>
                </div>
                <figure className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  <img
                    src={service.image}
                    alt={service.imageAlt}
                    className="block h-auto max-h-96 w-full object-contain object-center"
                    loading="lazy"
                  />
                </figure>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="scroll-mt-20 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Get in touch
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-500">
              Have a question, need a demo, or want to discuss your requirements? We are here to help.
            </p>
          </div>

          <div className="mt-10">
            <ContactForm />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-white">
                <FileText size={16} />
              </span>
              <span className="text-sm font-semibold text-slate-900">KeelBill Ledger</span>
            </div>

            <div className="flex items-center gap-6 text-sm text-slate-500">
              <button
                onClick={() => {
                  const el = document.getElementById('features');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="transition hover:text-slate-900"
              >
                Features
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById('contact');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="transition hover:text-slate-900"
              >
                Contact
              </button>
              <button
                onClick={() => navigate('/login')}
                className="font-semibold text-emerald-700 transition hover:text-emerald-800"
              >
                Login
              </button>
            </div>

            <p className="text-xs text-slate-400">
              &copy; {new Date().getFullYear()} KeelBill. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
