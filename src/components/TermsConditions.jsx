import { FileCheck2 } from 'lucide-react';

const TermsConditions = ({ register }) => {
  return (
    <section className="rounded-xl border border-[#1E3A5F]/10 bg-white p-5 sm:p-7 shadow-card-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-[#1E3A5F]/10 p-3 text-[#1E3A5F]">
          <FileCheck2 size={18} />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-[#1E3A5F]">Terms & Conditions</h2>
          <p className="mt-1 text-sm text-[#2D3748]/60">Payment terms, delivery notes, and other conditions.</p>
        </div>
      </div>

      <textarea
        rows={8}
        className="w-full rounded-lg border border-[#1E3A5F]/10 bg-[#1E3A5F]/5 px-4 py-3 text-sm text-[#1E3A5F] outline-none transition focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/25"
        {...register('quotation.terms')}
      />
    </section>
  );
};

export default TermsConditions;
