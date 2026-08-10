import { FileCheck2 } from 'lucide-react';

const TermsConditions = ({ register }) => {
  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-soft sm:p-7">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-2xl bg-brand-50 p-3 text-brand-600">
          <FileCheck2 size={18} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Terms & Conditions</h2>
          <p className="text-sm text-slate-500">Add the legal and payment terms for the quotation.</p>
        </div>
      </div>

      <textarea
        rows={8}
        className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        {...register('quotation.terms')}
      />
    </section>
  );
};

export default TermsConditions;
