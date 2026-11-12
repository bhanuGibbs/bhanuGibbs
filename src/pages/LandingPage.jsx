import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import LandingNavbar from '../components/LandingNavbar';
import ContactForm from '../components/ContactForm';

/* ── Icon components ── */
const IconFileText = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/>
    <path d="M14 2v6h6"/>
    <path d="M10 13H8"/><path d="M16 13H10"/><path d="M16 17H10"/><path d="M10 9H8"/>
  </svg>
);
const IconQuote = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>
    <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>
  </svg>
);
const IconInvoice = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/>
    <path d="M16 8h-6a1 1 0 0 0 0 1v6a1 1 0 0 0 0 1h6a1 1 0 0 0 0-1V9a1 1 0 0 0 0-1Z"/>
    <path d="M12 12.5h3"/>
  </svg>
);
const IconTruck = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11"/>
    <path d="M14 9h4l4 4v5c0 .6-.4 1-1 1h-2"/>
    <circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>
  </svg>
);
const IconBox = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);
const IconUsers = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconUser = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconBarChart = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>
  </svg>
);
const IconShield = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const IconCloud = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.5 19c0-3.037-2.463-5.5-5.5-5.5S6.5 15.963 6.5 19"/><path d="M20 16.5c.276 0 .5-.224.5-.5a1.5 1.5 0 0 0-1.5-1.5"/>
    <path d="M4 16.5c-.276 0-.5-.224-.5-.5a1.5 1.5 0 0 1 1.5-1.5"/>
    <path d="M12 13.5V3"/>
  </svg>
);
const IconZap = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);
const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconStar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const IconChevronDown = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const IconArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);
const IconWhatsApp = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);
const IconMail = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);
const IconPhone = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);
const IconMapPin = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);

/* ── Animated counter hook ── */
function useCounter(end, duration = 2000, startOnView = true) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    if (!startOnView) {
      setCount(end);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          let startTime;
          const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            setCount(Math.floor(progress * end));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration, startOnView]);

  return [count, ref];
}

/* ── Scroll reveal hook ── */
function useReveal(threshold = 0.1) {
  const ref = useRef(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, revealed];
}

/* ── Reveal wrapper component ── */
function Reveal({ children, delay = 0, threshold = 0.1 }) {
  const [ref, revealed] = useReveal(threshold);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${revealed ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ── Data ── */
const features = [
  { icon: <IconInvoice />, title: 'GST Billing', desc: 'Create GST-compliant invoices with automatic tax calculations, HSN codes, and e-invoice support.' },
  { icon: <IconQuote />, title: 'Quotations', desc: 'Generate professional quotations in seconds. Convert quotes to invoices with a single click.' },
  { icon: <IconFileText />, title: 'Invoices', desc: 'Design branded invoices, send via email, track payments, and manage recurring billing effortlessly.' },
  { icon: <IconTruck />, title: 'Delivery Challans', desc: 'Create, print, and track delivery challans. Manage dispatches and maintain complete audit trails.' },
  { icon: <IconBox />, title: 'Inventory Management', desc: 'Real-time stock tracking, low-stock alerts, batch management, and multi-warehouse support.' },
  { icon: <IconUser />, title: 'Customer Management', desc: 'Complete customer profiles, credit limits, payment history, and communication logs in one place.' },
  { icon: <IconUsers />, title: 'Multi-User Access', desc: 'Role-based access control, user activity logs, and team collaboration with granular permissions.' },
  { icon: <IconBarChart />, title: 'Reports & Analytics', desc: 'Sales reports, GST summaries, inventory valuation, and custom dashboards for data-driven decisions.' },
];

const salesRepSteps = [
  { step: 1, title: 'Sales Rep Login', desc: 'Field reps log in securely from any device.' },
  { step: 2, title: 'Create Order', desc: 'Enter orders on-the-go with customer details.' },
  { step: 3, title: 'Admin Review', desc: 'Orders are reviewed and approved by your team.' },
  { step: 4, title: 'Email Notification', desc: 'Automatic notifications keep everyone in sync.' },
  { step: 5, title: 'Order Processing', desc: 'Approved orders move to fulfillment instantly.' },
];

const salesRepBenefits = [
  'Real-time order submission from the field',
  'Track sales representative activity & performance',
  'Dealer and distributor management',
  'Customer visit logging and follow-ups',
  'Sales performance reports and analytics',
  'Territory-based order management',
];

const challanFeatures = [
  'Create delivery challans from existing orders',
  'Print professional PDF challans instantly',
  'Track delivery status in real-time',
  'Complete dispatch history and audit trail',
  'Customer delivery records and proof of delivery',
  'Multi-item challan support with batch tracking',
];

const whyChoose = [
  { icon: <IconZap />, title: 'Easy to Use', desc: 'Intuitive interface that your team can master in minutes, not days.' },
  { icon: <IconCloud />, title: 'Cloud Based', desc: 'Access your data from anywhere, anytime. Automatic backups keep everything safe.' },
  { icon: <IconShield />, title: 'Secure Data', desc: 'Enterprise-grade encryption and role-based access protect your business data.' },
  { icon: <IconFileText />, title: 'Affordable Pricing', desc: 'Transparent pricing with no hidden fees. Scale as your business grows.' },
];

const stats = [
  { value: 5000, suffix: '+', label: 'Invoices Generated' },
  { value: 100, suffix: '+', label: 'Businesses Trust Us' },
  { value: 99.9, suffix: '%', label: 'Uptime Guarantee', isDecimal: true },
  { value: 24, suffix: '/7', label: 'Customer Support' },
];

const screenshots = [
  { title: 'Billing & Invoices', image: '/images/billing-invoices.png', alt: 'Invoice management with payment tracking and status filters' },
  { title: 'Order Management', image: '/images/orders.png', alt: 'Create and track sales orders with approval workflow' },
  { title: 'Stock Transactions', image: '/images/inventory-transactions.png', alt: 'Record and monitor inventory stock movements' },
  { title: 'Customer Management', image: '/images/customer.png', alt: 'Customer account ledger' },
  { title: 'Product Catalog', image: '/images/products.png', alt: 'Product and inventory management screen' },
];

const testimonials = [
  { name: 'Rajesh Kumar', role: 'Owner, Kumar Traders', text: 'KeelBill transformed how we manage billing and inventory. GST compliance used to be a headache — now it\'s seamless.', rating: 5 },
  { name: 'Priya Sharma', role: 'Manager, Sharma Distributors', text: 'The sales rep module is a game-changer. Our field team submits orders directly, and we track everything in real-time.', rating: 5 },
  { name: 'Amit Patel', role: 'CEO, Patel Wholesale', text: 'We switched from manual billing to KeelBill and saved 15 hours per week. The challan management alone is worth it.', rating: 5 },
  { name: 'Sneha Reddy', role: 'Operations Head, Reddy Retail', text: 'The reporting dashboard gives us insights we never had before. We can see exactly which products are moving and where.', rating: 4 },
];

const pricingPlans = [
  {
    name: 'Free',
    price: '₹0',
    period: '/10 free months',
    desc: 'Get started with no cost — perfect for exploring KeelBill.',
    features: ['Up to 100 invoices/month', 'Basic inventory tracking', '1 user account', 'GST billing & e-invoicing', 'Community support'],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Custom',
    price: 'Custom',
    period: '',
    desc: 'Tailored solutions for your business, built to scale with you.',
    features: ['Unlimited invoices', 'Advanced inventory management', 'Unlimited user accounts', 'Sales rep module', 'Delivery challans', 'Custom reports', 'Priority support', 'WhatsApp integration', 'Multi-branch support', 'API access', 'Custom integrations'],
    cta: 'Contact Sales',
    highlighted: true,
  },
];

const faqs = [
  { q: 'Is KeelBill compliant with GST regulations?', a: 'Yes. KeelBill is fully GST-compliant with automatic tax calculations, HSN code support, e-invoice generation, and e-way bill integration. We stay updated with the latest GST rules.' },
  { q: 'Can I migrate data from my existing billing software?', a: 'Absolutely. We provide data migration tools and support to help you transfer your customers, products, and transaction history from your current system.' },
  { q: 'Do I need to install anything?', a: 'No. KeelBill is cloud-based and works in any modern browser. Access it from your computer, tablet, or phone without any installation.' },
  { q: 'What happens if I exceed my invoice limit?', a: 'You\'ll receive a notification before reaching your limit. You can upgrade your plan or wait for the next billing cycle. No invoices will be blocked unexpectedly.' },
  { q: 'Is my data secure?', a: 'Yes. We use bank-level encryption (AES-256), regular backups, and role-based access control. Your data is stored in secure, redundant data centers.' },
  { q: 'Can my sales team use KeelBill on mobile?', a: 'Yes. KeelBill works perfectly on mobile browsers. Sales representatives can create orders, check inventory, and view customer details from any device.' },
  { q: 'Do you offer a free trial?', a: 'Yes, we offer a 14-day free trial with full access to all features. No credit card required to get started.' },
  { q: 'Can I customize invoice templates?', a: 'Yes. You can customize invoice layouts, add your logo, choose colors, and include custom fields to match your brand.' },
  { q: 'What payment methods do you accept?', a: 'We accept all major credit/debit cards, net banking, UPI, and wire transfers. For enterprise plans, we also support annual billing with invoicing.' },
  { q: 'How do I get support?', a: 'Our support team is available 24/7 via email, phone, and WhatsApp. Professional and Enterprise plans include priority support with faster response times.' },
];

const industries = [
  { name: 'Small Businesses', icon: '🏪' },
  { name: 'Distributors', icon: '🚛' },
  { name: 'Wholesalers', icon: '📦' },
  { name: 'Retailers', icon: '🛒' },
  { name: 'Manufacturing', icon: '🏭' },
  { name: 'Sales Teams', icon: '👥' },
];

/* ── Main Component ── */
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
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA]">
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-8 shadow-card-sm">
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#2D3748] antialiased">
      <style>{`
        .landing-page ::selection { background: #FF6B35/20; color: #1E3A5F; }
        .landing-page :focus-visible { outline: 3px solid #FF6B35; outline-offset: 3px; }
        @media (prefers-reduced-motion: reduce) {
          .landing-page *, .landing-page *::before, .landing-page *::after {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      <LandingNavbar />

      <main>
        {/* ═══════════════════════════════════════════ */}
        {/* 2. HERO SECTION                             */}
        {/* ═══════════════════════════════════════════ */}
        <section className="relative overflow-hidden px-5 pb-16 pt-20 sm:pb-20 sm:pt-24 lg:pb-28 lg:pt-32">
          {/* Background decoration */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-1/4 top-0 h-[600px] w-[600px] rounded-full bg-[#FF6B35]/5 blur-3xl" />
            <div className="absolute -left-1/4 bottom-0 h-[400px] w-[400px] rounded-full bg-[#1E3A5F]/5 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-7xl">
            <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
              {/* Left: Copy */}
              <div>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#1E3A5F]/5 px-4 py-1.5 text-xs font-semibold text-[#1E3A5F]">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#22C55E]" />
                  Trusted by 100+ businesses across India
                </div>
                <h1 className="max-w-[48ch] text-4xl font-extrabold leading-[1.1] tracking-[-0.03em] sm:text-5xl lg:text-[3.5rem]">
                  <span className="bg-gradient-to-r from-[#1E3A5F] via-[#1E3A5F] to-[#FF6B35] bg-clip-text text-transparent">
                    Manage Billing, Inventory, Challans &amp; Sales Teams
                  </span>
                  <br />
                  <span className="text-[#1E3A5F]">in One Powerful Platform</span>
                </h1>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#2D3748]/80">
                  Simplify your business operations with smart billing, inventory tracking, quotation management, and sales representative automation.
                </p>
                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <button
                    onClick={() => navigate('/login')}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FF6B35] px-8 py-4 text-base font-bold text-white shadow-cta transition hover:bg-[#e55a28] hover:shadow-cta-hover active:translate-y-px"
                  >
                    Start Free Trial
                    <IconArrowRight />
                  </button>
                  <button
                    onClick={() => {
                      const el = document.getElementById('contact');
                      if (el) {
                        const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
                        el.scrollIntoView({ behavior });
                      }
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-[#1E3A5F]/15 bg-white px-8 py-4 text-base font-bold text-[#1E3A5F] transition hover:border-[#1E3A5F]/30 hover:bg-[#1E3A5F]/5"
                  >
                    Book Live Demo
                  </button>
                </div>
                <p className="mt-5 text-sm text-[#2D3748]/50">
                  No credit card required · 14-day free trial · Cancel anytime
                </p>
              </div>

              {/* Right: Dashboard mockup */}
              <div className="relative">
                <div className="animate-float">
                  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-card-lg">
                    {/* Browser chrome */}
                    <div className="flex items-center gap-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-4 py-3">
                      <div className="flex gap-1.5">
                        <div className="h-3 w-3 rounded-full bg-rose-400" />
                        <div className="h-3 w-3 rounded-full bg-amber-400" />
                        <div className="h-3 w-3 rounded-full bg-emerald-400" />
                      </div>
                      <div className="ml-2 flex flex-1 items-center justify-center">
                        <div className="flex max-w-xs items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs text-gray-500">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="18" height="11" x="3" y="3" rx="2"/>
                            <path d="M3 9h18"/>
                          </svg>
                          <span className="truncate">app.keelbill.com/dashboard</span>
                        </div>
                      </div>
                    </div>
                    <img
                      src="/images/orders.png"
                      alt="KeelBill order management showing create order form, order list with status tracking, and approval workflow"
                      className="block w-full"
                      fetchPriority="high"
                    />
                  </div>
                </div>
                {/* Floating billing card */}
                <div className="absolute -bottom-6 -left-6 hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-card-md sm:block">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#22C55E]/10 text-[#22C55E]">
                      <IconCheck />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1E3A5F]">Invoice Paid</p>
                      <p className="text-xs text-gray-500">₹45,000 — Kumar Traders</p>
                    </div>
                  </div>
                </div>
                {/* Floating mobile preview */}
                <div className="absolute -right-4 top-12 hidden rounded-2xl border border-gray-200 bg-white p-3 shadow-card-md lg:block">
                  <div className="overflow-hidden rounded-xl border border-gray-100">
                    <img
                      src="/images/pos.png"
                      alt="KeelBill mobile sales representative app"
                      className="h-28 w-20 object-cover"
                    />
                  </div>
                  <p className="mt-2 text-center text-[10px] font-medium text-gray-500">Sales Rep App</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════ */}
        {/* 3. TRUSTED BY SECTION                       */}
        {/* ═══════════════════════════════════════════ */}
        <section className="border-y border-gray-200/60 bg-white px-5 py-12">
          <div className="mx-auto max-w-7xl">
            <p className="mb-8 text-center text-sm font-medium text-gray-400">
              Trusted by businesses across India
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
              {['Kumar Traders', 'Sharma Distributors', 'Patel Wholesale', 'Reddy Retail', 'TechMart', 'GreenField Agro'].map((name) => (
                <div key={name} className="flex items-center gap-2 text-lg font-bold text-gray-300">
                  <div className="h-8 w-8 rounded-lg bg-gray-100" />
                  {name}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════ */}
        {/* 4. CORE FEATURES SECTION                    */}
        {/* ═══════════════════════════════════════════ */}
        <section id="features" className="scroll-mt-24 px-5 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#FF6B35]">Features</p>
              <h2 className="max-w-2xl mx-auto text-3xl font-extrabold leading-tight tracking-[-0.02em] text-[#1E3A5F] sm:text-4xl">
                Everything you need to run your business
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-[#2D3748]/70">
                Powerful tools designed for modern Indian businesses. From billing to inventory, we've got you covered.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <Reveal key={feature.title}>
                  <div
                    className="group relative overflow-hidden rounded-2xl border border-gray-200/60 bg-white p-6 shadow-card-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#FF6B35]/20 hover:shadow-card-md"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B35]/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="relative">
                      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#1E3A5F]/5 text-[#1E3A5F] transition-colors duration-300 group-hover:bg-[#FF6B35]/10 group-hover:text-[#FF6B35]">
                        {feature.icon}
                      </div>
                      <h3 className="mb-2 text-base font-bold text-[#1E3A5F]">{feature.title}</h3>
                      <p className="text-sm leading-relaxed text-[#2D3748]/70">{feature.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════ */}
        {/* 5. SALES REP MODULE                         */}
        {/* ═══════════════════════════════════════════ */}
        <section className="bg-white px-5 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="grid items-start gap-16 lg:grid-cols-2">
              {/* Left: Workflow */}
              <div>
                <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#FF6B35]">Sales Rep Module</p>
                <h2 className="max-w-lg text-3xl font-extrabold leading-tight tracking-[-0.02em] text-[#1E3A5F] sm:text-4xl">
                  Empower your field sales team
                </h2>
                <p className="mt-4 text-lg text-[#2D3748]/70">
                  Give your sales representatives the tools they need to create orders, track customers, and close deals — all from the field.
                </p>
                <div className="mt-10 space-y-0">
                  {salesRepSteps.map((item, i) => (
                    <div key={item.step} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#1E3A5F] to-[#1E3A5F]/80 text-sm font-bold text-white shadow-card-sm">
                            {item.step}
                          </div>
                        </div>
                        {i < salesRepSteps.length - 1 && (
                          <div className="mt-2 h-full w-0.5 rounded-full bg-gradient-to-b from-[#1E3A5F] to-[#1E3A5F]/20" />
                        )}
                      </div>
                      <div className="pb-8 pt-1">
                        <h4 className="text-sm font-bold text-[#1E3A5F]">{item.title}</h4>
                        <p className="mt-1 text-sm text-[#2D3748]/70">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Right: Benefits */}
              <div className="rounded-2xl bg-[#1E3A5F] p-8 text-white sm:p-10">
                <h3 className="text-xl font-bold">Key Benefits</h3>
                <ul className="mt-6 space-y-4">
                  {salesRepBenefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#22C55E]/20 text-[#22C55E]">
                        <IconCheck />
                      </span>
                      <span className="text-sm leading-relaxed text-white/90">{benefit}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => {
                    const el = document.getElementById('contact');
                    if (el) {
                      const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
                      el.scrollIntoView({ behavior });
                    }
                  }}
                  className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#FF6B35] px-6 py-3 text-sm font-bold text-white shadow-cta transition hover:bg-[#e55a28]"
                >
                  Try Sales Rep Module
                  <IconArrowRight />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════ */}
        {/* 6. CHALLAN MODULE                           */}
        {/* ═══════════════════════════════════════════ */}
        <section className="px-5 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="grid items-center gap-16 lg:grid-cols-2">
              {/* Left: Challan preview */}
              <div className="order-2 lg:order-1">
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-card-md">
                  <img
                    src="/images/delivery-challan-preview.jpg"
                    alt="Delivery challan with consignor, consignee, and dispatch details"
                    className="block w-full"
                  />
                </div>
              </div>
              {/* Right: Features */}
              <div className="order-1 lg:order-2">
                <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#FF6B35]">Challan Management</p>
                <h2 className="max-w-lg text-3xl font-extrabold leading-tight tracking-[-0.02em] text-[#1E3A5F] sm:text-4xl">
                  Streamline your delivery process
                </h2>
                <p className="mt-4 text-lg text-[#2D3748]/70">
                  Create, print, and track delivery challans with complete transparency and audit trails.
                </p>
                <ul className="mt-8 space-y-4">
                  {challanFeatures.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#22C55E]/10 text-[#22C55E]">
                        <IconCheck />
                      </span>
                      <span className="text-sm leading-relaxed text-[#2D3748]/80">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════ */}
        {/* 7. WHY CHOOSE KEELBILL                      */}
        {/* ═══════════════════════════════════════════ */}
        <section className="bg-white px-5 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 text-center">
              <h2 className="max-w-2xl mx-auto text-3xl font-extrabold leading-tight tracking-[-0.02em] text-[#1E3A5F] sm:text-4xl">
                Why choose KeelBill?
              </h2>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {whyChoose.map((item) => (
                <div key={item.title} className="text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FF6B35]/10 text-[#FF6B35]">
                    {item.icon}
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-[#1E3A5F]">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-[#2D3748]/70">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════ */}
        {/* 8. STATISTICS SECTION                       */}
        {/* ═══════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-[#1E3A5F] px-5 py-20 sm:py-28">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-32 top-0 h-96 w-96 rounded-full bg-[#FF6B35]/10 blur-3xl" />
            <div className="absolute -left-32 bottom-0 h-96 w-96 rounded-full bg-[#22C55E]/10 blur-3xl" />
          </div>
          <div className="relative mx-auto grid max-w-5xl grid-cols-2 gap-8 lg:grid-cols-4">
            {stats.map((stat, index) => {
              const [count, ref] = useCounter(stat.value, 2000);
              return (
                <div key={stat.label} ref={ref} className="relative text-center">
                  {index < stats.length - 1 && (
                    <div className="absolute -right-4 top-1/2 h-12 w-px bg-white/10 hidden lg:block" />
                  )}
                  <div className="text-4xl font-extrabold text-white sm:text-5xl">
                    {stat.isDecimal ? (count / 10).toFixed(1) : count.toLocaleString()}
                    <span className="text-[#FF6B35]">{stat.suffix}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-white/70">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ═══════════════════════════════════════════ */}
        {/* 9. SCREENSHOTS SECTION                      */}
        {/* ═══════════════════════════════════════════ */}
        <section className="px-5 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#FF6B35]">Product Tour</p>
              <h2 className="max-w-2xl mx-auto text-3xl font-extrabold leading-tight tracking-[-0.02em] text-[#1E3A5F] sm:text-4xl">
                See KeelBill in action
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {screenshots.map((shot, i) => (
                <Reveal key={shot.title} delay={i * 100}>
                  <div
                    className="group overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-card-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-card-md"
                  >
                    <div className="relative overflow-hidden">
                      <img
                        src={shot.image}
                        alt={shot.alt}
                        className="block w-full transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1E3A5F]/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      <div className="absolute bottom-0 left-0 right-0 translate-y-full p-4 text-white transition-transform duration-300 group-hover:translate-y-0">
                        <p className="text-sm font-semibold">{shot.title}</p>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-bold text-[#1E3A5F]">{shot.title}</h3>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════ */}
        {/* 10. TESTIMONIALS SECTION                    */}
        {/* ═══════════════════════════════════════════ */}
        <section id="testimonials" className="scroll-mt-24 bg-white px-5 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#FF6B35]">Testimonials</p>
              <h2 className="max-w-2xl mx-auto text-3xl font-extrabold leading-tight tracking-[-0.02em] text-[#1E3A5F] sm:text-4xl">
                Loved by businesses across India
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {testimonials.map((t, i) => (
                <Reveal key={t.name} delay={i * 100}>
                  <div
                    className="relative rounded-2xl border border-gray-200/60 bg-[#F8F9FA] p-6 shadow-card-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-card-md"
                  >
                    <div className="absolute -top-3 left-6 text-5xl font-serif text-[#FF6B35]/20 leading-none">&ldquo;</div>
                    <div className="mb-4 flex gap-0.5 text-[#FF6B35]">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <IconStar key={i} />
                      ))}
                      {Array.from({ length: 5 - t.rating }).map((_, i) => (
                        <div key={i} className="text-gray-300"><IconStar /></div>
                      ))}
                    </div>
                    <p className="mb-4 text-sm leading-relaxed text-[#2D3748]/80">&ldquo;{t.text}&rdquo;</p>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#1E3A5F] to-[#1E3A5F]/80 text-sm font-bold text-white shadow-card-sm">
                        {t.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1E3A5F]">{t.name}</p>
                        <p className="text-xs text-gray-500">{t.role}</p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════ */}
        {/* 11. PRICING SECTION                         */}
        {/* ═══════════════════════════════════════════ */}
        <section id="pricing" className="scroll-mt-24 px-5 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#FF6B35]">Pricing</p>
              <h2 className="max-w-2xl mx-auto text-3xl font-extrabold leading-tight tracking-[-0.02em] text-[#1E3A5F] sm:text-4xl">
                Simple, transparent pricing
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-lg text-[#2D3748]/70">
                Start free, scale as you grow. No hidden fees, no surprises.
              </p>
            </div>
            <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
              {pricingPlans.map((plan, i) => (
                <Reveal key={plan.name} delay={i * 150}>
                  <div
                    className={`relative rounded-2xl border p-8 transition-all duration-300 hover:-translate-y-1 ${
                      plan.highlighted
                        ? 'border-[#FF6B35] bg-white shadow-card-lg scale-105'
                        : 'border-gray-200/60 bg-white shadow-card-sm hover:shadow-card-md'
                    }`}
                  >
                    {plan.highlighted && (
                      <>
                        <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-[#FF6B35] to-[#FF6B35]/30 opacity-20 blur-sm" />
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                          <span className="rounded-full bg-gradient-to-r from-[#FF6B35] to-[#e55a28] px-5 py-1.5 text-xs font-bold text-white shadow-cta">
                            Most Popular
                          </span>
                        </div>
                      </>
                    )}
                    <div className="relative">
                      <h3 className="text-lg font-bold text-[#1E3A5F]">{plan.name}</h3>
                      <div className="mt-4 flex items-baseline gap-1">
                        <span className="text-4xl font-extrabold text-[#1E3A5F]">{plan.price}</span>
                        <span className="text-sm text-gray-500">{plan.period}</span>
                      </div>
                      <p className="mt-2 text-sm text-[#2D3748]/70">{plan.desc}</p>
                      <ul className="mt-6 space-y-3">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-start gap-2.5">
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#22C55E]/10 text-[#22C55E]">
                              <IconCheck />
                            </span>
                            <span className="text-sm text-[#2D3748]/80">{f}</span>
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={() => {
                          if (plan.cta === 'Contact Sales') {
                            const el = document.getElementById('contact');
                            if (el) {
                              const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
                              el.scrollIntoView({ behavior });
                            }
                          } else {
                            navigate('/login');
                          }
                        }}
                        className={`mt-8 w-full rounded-xl px-6 py-3.5 text-sm font-bold transition ${
                          plan.highlighted
                            ? 'bg-[#FF6B35] text-white shadow-cta hover:bg-[#e55a28] hover:shadow-cta-hover active:translate-y-px'
                            : 'border-2 border-[#1E3A5F]/15 bg-white text-[#1E3A5F] hover:border-[#1E3A5F]/30 hover:bg-[#1E3A5F]/5'
                        }`}
                      >
                        {plan.cta}
                      </button>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════ */}
        {/* 12. FAQ SECTION                             */}
        {/* ═══════════════════════════════════════════ */}
        <section className="bg-white px-5 py-20 sm:py-28">
          <div className="mx-auto max-w-3xl">
            <div className="mb-16 text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#FF6B35]">FAQ</p>
              <h2 className="text-3xl font-extrabold leading-tight tracking-[-0.02em] text-[#1E3A5F] sm:text-4xl">
                Frequently asked questions
              </h2>
            </div>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <Reveal key={i} delay={i * 50}>
                  <FAQItem question={faq.q} answer={faq.a} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════ */}
        {/* 13. FINAL CTA SECTION                       */}
        {/* ═══════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-[#1E3A5F] px-5 py-20 sm:py-28">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-32 top-0 h-96 w-96 rounded-full bg-[#FF6B35]/10 blur-3xl" />
            <div className="absolute -left-32 bottom-0 h-96 w-96 rounded-full bg-[#22C55E]/10 blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-extrabold leading-tight tracking-[-0.02em] text-white sm:text-4xl">
              Ready to Simplify Your Business Operations?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-lg text-white/70">
              Join 100+ businesses that trust KeelBill for their billing, inventory, and sales management.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#FF6B35] px-8 py-4 text-base font-bold text-white shadow-cta transition hover:bg-[#e55a28] hover:shadow-cta-hover active:translate-y-px"
              >
                Start Free Trial Today
                <IconArrowRight />
              </button>
            </div>
            <p className="mt-4 text-sm text-white/50">
              No credit card required · 14-day free trial · Setup in 5 minutes
            </p>
          </div>
        </section>

        {/* ═══════════════════════════════════════════ */}
        {/* 14. CONTACT / INDUSTRIES SECTION            */}
        {/* ═══════════════════════════════════════════ */}
        <section id="industries" className="scroll-mt-24 px-5 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#FF6B35]">Industries</p>
              <h2 className="max-w-2xl mx-auto text-3xl font-extrabold leading-tight tracking-[-0.02em] text-[#1E3A5F] sm:text-4xl">
                Built for every type of business
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {industries.map((ind) => (
                <div
                  key={ind.name}
                  className="flex items-center gap-4 rounded-2xl border border-gray-200/60 bg-white p-6 shadow-card-sm transition hover:-translate-y-1 hover:shadow-card-md"
                >
                  <span className="text-3xl">{ind.icon}</span>
                  <span className="text-base font-bold text-[#1E3A5F]">{ind.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="scroll-mt-24 bg-white px-5 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 max-w-xl">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#FF6B35]">Contact</p>
              <h2 className="text-3xl font-extrabold tracking-[-0.02em] text-[#1E3A5F] sm:text-4xl">
                Let's make billing simpler.
              </h2>
              <p className="mt-3 text-lg text-[#2D3748]/70">
                Have a question, need a demo, or want to discuss your requirements? We are here to help.
              </p>
            </div>
            <ContactForm />
          </div>
        </section>
      </main>

      {/* ═══════════════════════════════════════════ */}
      {/* FOOTER                                      */}
      {/* ═══════════════════════════════════════════ */}
      <footer className="bg-[#1E3A5F] px-5 py-16 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 17V3H17V17H7Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 21H21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 9H15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 13H13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-lg font-bold">KeelBill</span>
              </div>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
                Modern billing and business management software for Indian businesses.
              </p>
            </div>
            {/* Product */}
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/40">Product</h4>
              <ul className="space-y-3">
                {['Features', 'Pricing', 'Sales Rep Module', 'Challan Management', 'Reports'].map((item) => (
                  <li key={item}>
                    <button className="text-sm text-white/70 transition hover:text-white">{item}</button>
                  </li>
                ))}
              </ul>
            </div>
            {/* Company */}
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/40">Company</h4>
              <ul className="space-y-3">
                {['About', 'Blog', 'Careers', 'Contact'].map((item) => (
                  <li key={item}>
                    <button className="text-sm text-white/70 transition hover:text-white">{item}</button>
                  </li>
                ))}
              </ul>
            </div>
            {/* Contact */}
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/40">Get in Touch</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm text-white/70">
                  <IconWhatsApp />
                  <a href="https://wa.me/917893599474" className="transition hover:text-white">+91 7893599474</a>
                </li>
                <li className="flex items-center gap-3 text-sm text-white/70">
                  <IconMail />
                  <a href="mailto:keelbillsol@gmail.com" className="transition hover:text-white">keelbillsol@gmail.com</a>
                </li>
                <li className="flex items-center gap-3 text-sm text-white/70">
                  <IconPhone />
                  <a href="tel:+917893599474" className="transition hover:text-white">+91 7893599474</a>
                </li>
                <li className="flex items-start gap-3 text-sm text-white/70">
                  <IconMapPin />
                  <span>Vizianagaram, Andhra Pradesh, India</span>
                </li>
              </ul>
              {/* Social Icons */}
              <div className="mt-6 flex items-center gap-3">
                <a href="https://facebook.com" className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white/60 transition hover:bg-[#FF6B35] hover:text-white" aria-label="Facebook">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="https://instagram.com" className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white/60 transition hover:bg-[#FF6B35] hover:text-white" aria-label="Instagram">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
                <a href="https://linkedin.com" className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white/60 transition hover:bg-[#FF6B35] hover:text-white" aria-label="LinkedIn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
                <a href="https://twitter.com" className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white/60 transition hover:bg-[#FF6B35] hover:text-white" aria-label="Twitter / X">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
              </div>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
            <p className="text-xs text-white/40">
              &copy; {new Date().getFullYear()} KeelBill. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-xs text-white/40">
              <button className="transition hover:text-white">Privacy Policy</button>
              <button className="transition hover:text-white">Terms of Service</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

/* ── FAQ Accordion Item ── */
function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`group overflow-hidden rounded-2xl border bg-[#F8F9FA] transition-all duration-300 ${
      open ? 'border-[#FF6B35]/30 shadow-card-sm' : 'border-gray-200/60 hover:border-[#1E3A5F]/20 hover:shadow-card-sm'
    }`}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-6 py-5 text-left"
        aria-expanded={open}
      >
        <span className={`pr-4 text-sm font-semibold transition-colors ${open ? 'text-[#FF6B35]' : 'text-[#1E3A5F] group-hover:text-[#FF6B35]'}`}>{question}</span>
        <span className={`shrink-0 text-[#1E3A5F] transition-all duration-300 ${open ? 'rotate-180 text-[#FF6B35]' : 'group-hover:text-[#FF6B35]'}`}>
          <IconChevronDown />
        </span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-96 pb-5' : 'max-h-0'}`}>
        <p className="px-6 text-sm leading-relaxed text-[#2D3748]/70">{answer}</p>
      </div>
    </div>
  );
}

export default LandingPage;
