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
    <section className="rounded-xl border border-[#1E3A5F]/10 bg-white p-5 sm:p-7 shadow-card-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-[#1E3A5F]/10 p-3 text-[#1E3A5F]">
          <ReceiptText size={18} /> 
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-[#1E3A5F]">Summary</h2>
          <p className="mt-1 text-sm text-[#2D3748]/60">Subtotals, taxes, and the final amount.</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4 rounded-3xl border border-[#1E3A5F]/10 bg-[#1E3A5F]/5 p-5">
          <div className="flex items-center justify-between text-sm text-[#2D3748]">
            <span>Subtotal</span>
            <span className="font-semibold text-[#1E3A5F]">₹{summary.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-[#2D3748]">
            <span>Discount</span>
            <span className="font-semibold text-[#FF6B35]">-₹{summary.discount.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-[#2D3748]">
            <span>GST Total</span>
            <span className="font-semibold text-[#1E3A5F]">₹{summary.gstTotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-[#2D3748]">
            <span>Shipping Charges</span>
            <span className="font-semibold text-[#1E3A5F]">₹{summary.shipping.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-[#1E3A5F]/10 pt-4 text-base font-semibold text-[#1E3A5F]">
            <span>Grand Total</span>
            <span className="text-[#FF6B35]">₹{summary.grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="rounded-3xl border border-[#1E3A5F]/10 bg-white p-5">
          <label className="mb-2 block text-sm font-medium text-[#1E3A5F]">Shipping Charges</label>
          <input
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            className="w-full rounded-lg border border-[#1E3A5F]/10 bg-[#1E3A5F]/5 px-4 py-3 text-sm text-[#1E3A5F] outline-none transition focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/25"
            {...register('shipping', { min: 0 })}
            onChange={(event) => {
              event.target.value = decimalOnly(event.target.value, 12);
              handleShippingChange(event);
            }}
          />
          <p className="mt-3 text-sm text-[#2D3748]/60">Shipping is included in the grand total automatically.</p>
        </div>
      </div>
    </section>
  );
};

export default Summary;
