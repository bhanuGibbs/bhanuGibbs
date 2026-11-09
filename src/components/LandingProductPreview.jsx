const invoicePreview = '/images/invoice.png';

const LandingProductPreview = () => (
  <figure className="mx-auto w-full min-w-0 overflow-hidden rounded-lg border border-[#e7dfd8] bg-white">
    <div className="flex items-center justify-between border-b border-[#e7dfd8] px-4 py-3 sm:px-5">
      <div className="flex items-center gap-2 text-xs font-semibold text-[#1a1a1a]">
        KeelBill Ledger
      </div>
      <span className="text-xs text-[#555555]">Invoice workspace</span>
    </div>
    <img
      src={invoicePreview}
      alt="KeelBill Ledger invoices page showing payment status and downloadable invoices"
      className="block h-auto w-full"
      fetchPriority="high"
    />
  </figure>
);

export default LandingProductPreview;
