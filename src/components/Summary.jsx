import { ReceiptText } from 'lucide-react';
import { calculateSummary } from '../utils/calculations';
import { decimalOnly } from '../utils/numericInput';

const Summary = ({ items, shipping, register, setValue, watch }) => {
  const summary = calculateSummary(items, shipping);

  const handleShippingChange = (event) => {
    const value = event.target.value;
    setValue('shipping', Number(value || 0), { shouldDirty: true, shouldValidate: true });
  };

  return (
    <section className="rounded-2xl border border-slate-200/60 bg-white p-5 sm:p-7">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
          <ReceiptText size={18} /> 
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">Summary</h2>
          <p className="mt-1 text-sm text-slate-500">Subtotals, taxes, and the final amount.</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>Subtotal</span>
            <span className="font-semibold text-slate-900">₹{summary.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>Discount</span>
            <span className="font-semibold text-emerald-700">-₹{summary.discount.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>GST Total</span>
            <span className="font-semibold text-slate-900">₹{summary.gstTotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>Shipping Charges</span>
            <span className="font-semibold text-slate-900">₹{summary.shipping.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-base font-semibold text-slate-900">
            <span>Grand Total</span>
            <span className="text-emerald-700">₹{summary.grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <label className="mb-2 block text-sm font-medium text-slate-700">Shipping Charges</label>
          <input
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            {...register('shipping', { min: 0 })}
            onChange={(event) => {
              event.target.value = decimalOnly(event.target.value, 12);
              handleShippingChange(event);
            }}
          />
          <p className="mt-3 text-sm text-slate-500">Shipping is included in the grand total automatically.</p>
        </div>
      </div>
    </section>
  );
};

export default Summary;
