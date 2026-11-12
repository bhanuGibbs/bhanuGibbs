import { useId } from 'react';
import { CalendarDays } from 'lucide-react';

const DateInput = ({ label, registration, value, onChange, min, max, error, id: providedId }) => {
  const generatedId = useId();
  const id = providedId || generatedId;

  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-[#1E3A5F]">{label}</label>
      <div className="relative min-w-0">
        <CalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#2D3748]/40" size={17} aria-hidden="true" />
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
          className="date-input block min-h-12 min-w-0 w-full max-w-full rounded-lg border border-[#2D3748]/20 bg-white py-3 pl-10 pr-3 text-left text-base text-[#1E3A5F] outline-none transition focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/25 aria-[invalid=true]:border-rose-400"
        />
      </div>
      {error ? <p id={`${id}-error`} role="alert" className="mt-1 text-sm text-rose-600">{error}</p> : null}
    </div>
  );
};

export default DateInput;
