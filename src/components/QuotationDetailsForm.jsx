import { FileText, IndianRupee } from 'lucide-react';
import DateInput from './DateInput';

const inputClass = 'block min-w-0 w-full max-w-full rounded-lg border border-[#2D3748]/20 bg-white px-4 py-3 text-sm text-[#1E3A5F] outline-none transition focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/25';
const labelClass = 'mb-2 block text-sm font-medium text-[#1E3A5F]';

const QuotationDetailsForm = ({ register, errors, watch, documentMode = 'quotation' }) => {
  const isInvoice = documentMode === 'billing' || documentMode === 'invoice';
  const documentLabel = isInvoice ? 'Invoice' : 'Quotation';
  const quotationDate = watch ? watch('quotation.quotationDate') : undefined;

  return (
    <section className="rounded-xl border border-[#1E3A5F]/10 bg-white p-5 sm:p-7 shadow-card-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-[#1E3A5F]/10 p-3 text-[#1E3A5F]">
          <FileText size={18} />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-[#1E3A5F]">{documentLabel} Details</h2>
          <p className="mt-1 text-sm text-[#2D3748]/60">Reference number, dates, and currency for this document.</p>
        </div>
      </div>

      <div className="grid min-w-0 gap-5 md:grid-cols-2">
        <div className="min-w-0">
          <label className={labelClass}>{documentLabel} Number</label>
          <input className={inputClass} readOnly value="Auto generated" />
          <p className="mt-2 text-xs text-[#2D3748]/60">
            Assigned when finalized, for example {isInvoice ? 'INV' : 'QT'}-09082026-001
          </p>
        </div>

        <div className="min-w-0">
          <label className={labelClass}>Currency</label>
          <div className="relative min-w-0">
            <IndianRupee className="pointer-events-none absolute left-3 top-3 text-[#2D3748]/40" size={16} />
            <select className={`${inputClass} pl-10`} {...register('quotation.currency')}>
              <option value="INR">Indian Rupee (₹ INR)</option>
              <option value="USD">US Dollar ($ USD)</option>
              <option value="EUR">Euro (€ EUR)</option>
            </select>
          </div>
          {errors.quotation?.currency ? <p className="mt-1 text-sm text-rose-500">{errors.quotation.currency.message}</p> : null}
        </div>

        <DateInput label={`${documentLabel} Date`} registration={register('quotation.quotationDate')} error={errors.quotation?.quotationDate?.message} />
        <DateInput label="Valid Until" registration={register('quotation.validUntil')} error={errors.quotation?.validUntil?.message} min={quotationDate || undefined} />
      </div>
    </section>
  );
};

export default QuotationDetailsForm;
