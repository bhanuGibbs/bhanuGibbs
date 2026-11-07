import { ArrowUpRight, CircleCheck } from 'lucide-react';
import invoicePreview from '../assets/images/invoice.png';

const LandingProductPreview = () => (
  <figure className="mx-auto w-full min-w-0 overflow-hidden rounded-2xl border border-[#e7dfd8] bg-white shadow-[0_18px_48px_rgba(47,54,51,0.12)]">
    <div className="flex items-center justify-between border-b border-[#e7dfd8] px-4 py-3 sm:px-5">
      <div className="flex items-center gap-2 text-xs font-semibold text-[#1a1a1a]">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#e1f3ed] text-[#00605d]">
          <CircleCheck size={15} />
        </span>
        Your billing workspace
      </div>
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-[0.12em] text-[#00605d]">
        INVOICES
        <ArrowUpRight size={13} />
      </span>
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
