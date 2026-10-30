import { useId } from 'react';
import { CalendarDays } from 'lucide-react';

const DateInput = ({ label, registration, value, onChange, min, max, error, id: providedId }) => {
  const generatedId = useId();
  const id = providedId || generatedId;

  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
      <div className="relative min-w-0">
        <CalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} aria-hidden="true" />
        <input
          {...registration}
          id={id}
          type="date"
          value={value}
          onChange={onChange || registration?.onChange}
          min={min}
          max={max}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="date-input block min-h-12 min-w-0 w-full max-w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-left text-base text-slate-700 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 aria-[invalid=true]:border-rose-400"
        />
      </div>
      {error ? <p id={`${id}-error`} role="alert" className="mt-1 text-sm text-rose-600">{error}</p> : null}
    </div>
  );
};

export default DateInput;
