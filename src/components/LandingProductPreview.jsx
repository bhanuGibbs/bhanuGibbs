import invoicePreview from '../assets/images/invoice.png';

const LandingProductPreview = () => (
  <figure className="mx-auto mt-10 w-full min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 sm:mt-12">
    <img
      src={invoicePreview}
      alt="KeelBill Ledger invoices page showing payment status and downloadable invoices"
      className="block h-auto w-full"
      fetchPriority="high"
    />
  </figure>
);

export default LandingProductPreview;
