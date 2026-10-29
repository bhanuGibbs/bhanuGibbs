import { FileText, CalendarDays, CircleDollarSign } from 'lucide-react';

const inputClass = 'block min-w-0 w-full max-w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100';
const labelClass = 'mb-2 block text-sm font-medium text-slate-700';

const QuotationDetailsForm = ({ register, errors, documentMode = 'quotation' }) => {
  const isInvoice = documentMode === 'billing' || documentMode === 'invoice';
  const documentLabel = isInvoice ? 'Invoice' : 'Quotation';

  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-soft sm:p-7">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-2xl bg-brand-50 p-3 text-brand-600">
          <FileText size={18} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{documentLabel} Details</h2>
          <p className="text-sm text-slate-500">Set the reference number, validity, and currency.</p>
        </div>
      </div>

      <div className="grid min-w-0 gap-5 md:grid-cols-2">
        <div className="min-w-0">
          <label className={labelClass}>{documentLabel} Number</label>
          <input className={inputClass} readOnly value="Auto generated" />
          <p className="mt-2 text-xs text-slate-500">
            Assigned when finalized, for example {isInvoice ? 'INV' : 'QT'}-09082026-001
          </p>
        </div>

        <div className="min-w-0">
          <label className={labelClass}>Currency</label>
          <div className="relative min-w-0">
            <CircleDollarSign className="pointer-events-none absolute left-3 top-3 text-slate-400" size={16} />
            <select className={`${inputClass} pl-10`} {...register('quotation.currency')}>
              <option value="INR">Indian Rupee (INR)</option>
              <option value="USD">US Dollar (USD)</option>
              <option value="EUR">Euro (EUR)</option>
            </select>
          </div>
          {errors.quotation?.currency ? <p className="mt-1 text-sm text-rose-500">{errors.quotation.currency.message}</p> : null}
        </div>

        <div className="min-w-0">
          <label className={labelClass}>Quotation Date</label>
          <div className="relative min-w-0">
            <CalendarDays className="pointer-events-none absolute left-3 top-3 text-slate-400" size={16} />
            <input type="date" className={`${inputClass} pl-10`} {...register('quotation.quotationDate')} />
          </div>
          {errors.quotation?.quotationDate ? <p className="mt-1 text-sm text-rose-500">{errors.quotation.quotationDate.message}</p> : null}
        </div>

        <div className="min-w-0">
          <label className={labelClass}>Valid Until</label>
          <div className="relative min-w-0">
            <CalendarDays className="pointer-events-none absolute left-3 top-3 text-slate-400" size={16} />
            <input type="date" className={`${inputClass} pl-10`} {...register('quotation.validUntil')} />
          </div>
          {errors.quotation?.validUntil ? <p className="mt-1 text-sm text-rose-500">{errors.quotation.validUntil.message}</p> : null}
        </div>
      </div>
    </section>
  );
};

export default QuotationDetailsForm;
