import { useState, useMemo } from 'react';
import { UserRound, Mail, Phone } from 'lucide-react';
import { digitsOnly, nameOnly, NAME_REGEX, PHONE_NUMBER_REGEX, PINCODE_REGEX, GSTIN_REGEX, preventPaste } from '../utils/numericInput';
import { indianStates, getCitiesForState } from '../utils/indianStates';

const inputClass = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';
const selectClass = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60';
const labelClass = 'mb-2 block text-sm font-medium text-slate-700';

const CustomerDetailsForm = ({ register, errors, watch, setValue }) => {
  const [country, setCountry] = useState('India');
  const [selectedState, setSelectedState] = useState('');
  const cities = useMemo(() => getCitiesForState(selectedState), [selectedState]);
  return (
    <section className="rounded-2xl border border-slate-200/60 bg-white p-5 sm:p-7">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
          <UserRound size={18} />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">Customer Details</h2>
          <p className="mt-1 text-sm text-slate-500">Information about the customer receiving this document.</p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className={labelClass}>Customer Name</label>
          <input className={inputClass} {...register('customer.name', { pattern: { value: NAME_REGEX, message: 'Please enter only alphabetic characters' }, onChange: (event) => { event.target.value = nameOnly(event.target.value); } })} />
          {errors.customer?.name ? <p className="mt-1 text-sm text-rose-500">{errors.customer.name.message}</p> : null}
        </div>

        <div>
          <label className={labelClass}>Company Name</label>
          <input className={inputClass} {...register('customer.companyName', { pattern: { value: NAME_REGEX, message: 'Please enter only alphabetic characters' }, onChange: (event) => { event.target.value = nameOnly(event.target.value); } })} />
          {errors.customer?.companyName ? <p className="mt-1 text-sm text-rose-500">{errors.customer.companyName.message}</p> : null}
        </div>

        <div className="md:col-span-2">
          <label className={labelClass}>Address</label>
          <textarea rows="3" className={inputClass} {...register('customer.address')} />
          {errors.customer?.address ? <p className="mt-1 text-sm text-rose-500">{errors.customer.address.message}</p> : null}
        </div>

        <div>
          <label className={labelClass}>Country</label>
          <select className={selectClass} value={country} onChange={(event) => { setCountry(event.target.value); setValue('customer.country', event.target.value, { shouldValidate: true }); }}>
            <option value="India">India</option>
          </select>
          {errors.customer?.country ? <p className="mt-1 text-sm text-rose-500">{errors.customer.country.message}</p> : null}
        </div>

        <div>
          <label className={labelClass}>State</label>
          <select className={selectClass} value={selectedState || ''} onChange={(event) => { setSelectedState(event.target.value); setValue('customer.state', event.target.value || '', { shouldValidate: true }); setValue('customer.city', '', { shouldValidate: true }); }}>
            <option value="">Select state</option>
            {indianStates.map((state) => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
          {errors.customer?.state ? <p className="mt-1 text-sm text-rose-500">{errors.customer.state.message}</p> : null}
        </div>

        <div>
          <label className={labelClass}>City</label>
          <select className={selectClass} value={watch('customer.city') || ''} onChange={(event) => { setValue('customer.city', event.target.value || '', { shouldValidate: true }); }} disabled={!selectedState}>
            <option value="">Select city</option>
            {cities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
          {errors.customer?.city ? <p className="mt-1 text-sm text-rose-500">{errors.customer.city.message}</p> : null}
        </div>

        <div>
          <label className={labelClass}>Pincode</label>
          <input className={inputClass} inputMode="numeric" maxLength={6} onPaste={preventPaste} {...register('customer.pincode', { pattern: { value: PINCODE_REGEX, message: 'Pincode must be exactly 6 digits' }, onChange: (event) => { event.target.value = digitsOnly(event.target.value, 6); } })} />
          {errors.customer?.pincode ? <p className="mt-1 text-sm text-rose-500">Please provide valid data: enter a 6-digit PIN code.</p> : null}
        </div>

        <div>
          <label className={labelClass}>GST Number</label>
          <input className={inputClass} maxLength={15} {...register('customer.gstNumber', { pattern: { value: GSTIN_REGEX, message: 'Enter a valid GSTIN (15 characters)' } })} />
          {errors.customer?.gstNumber ? <p className="mt-1 text-sm text-rose-500">{errors.customer.gstNumber.message}</p> : null}
        </div>

        <div>
          <label className={labelClass}>Phone Number</label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-3 text-slate-400" size={16} />
            <input className={`${inputClass} pl-10`} type="tel" inputMode="numeric" maxLength={10} onPaste={preventPaste} {...register('customer.phone', { pattern: { value: PHONE_NUMBER_REGEX, message: 'Please provide valid data: enter a 10-digit mobile number.' }, onChange: (event) => { event.target.value = digitsOnly(event.target.value, 10); } })} />
          </div>
          {errors.customer?.phone ? <p className="mt-1 text-sm text-rose-500">Please provide valid data: enter a 10-digit mobile number.</p> : null}
        </div>

        <div>
          <label className={labelClass}>Email</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-3 text-slate-400" size={16} />
            <input className={`${inputClass} pl-10`} {...register('customer.email', { pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' } })} />
          </div>
          {errors.customer?.email ? <p className="mt-1 text-sm text-rose-500">{errors.customer.email.message}</p> : null}
        </div>
      </div>
    </section>
  );
};

export default CustomerDetailsForm;
