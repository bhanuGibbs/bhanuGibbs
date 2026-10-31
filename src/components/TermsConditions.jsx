import { FileCheck2 } from 'lucide-react';

const TermsConditions = ({ register }) => {
  return (
    <section className="rounded-2xl border border-slate-200/60 bg-white p-5 sm:p-7">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
          <FileCheck2 size={18} />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">Terms & Conditions</h2>
          <p className="mt-1 text-sm text-slate-500">Payment terms, delivery notes, and other conditions.</p>
        </div>
      </div>

      <textarea
        rows={8}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        {...register('quotation.terms')}
      />
    </section>
  );
};

export default TermsConditions;
