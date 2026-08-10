import { UserRound, Mail, Phone, MapPin, Building2 } from 'lucide-react';

const inputClass = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100';
const labelClass = 'mb-2 block text-sm font-medium text-slate-700';

const CustomerDetailsForm = ({ register, errors }) => {
  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-soft sm:p-7">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-2xl bg-brand-50 p-3 text-brand-600">
          <UserRound size={18} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Customer Details</h2>
          <p className="text-sm text-slate-500">Capture the recipient’s details and billing address.</p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className={labelClass}>Customer Name</label>
          <input className={inputClass} {...register('customer.name')} />
          {errors.customer?.name ? <p className="mt-1 text-sm text-rose-500">{errors.customer.name.message}</p> : null}
        </div>

        <div>
          <label className={labelClass}>Company Name</label>
          <input className={inputClass} {...register('customer.companyName')} />
          {errors.customer?.companyName ? <p className="mt-1 text-sm text-rose-500">{errors.customer.companyName.message}</p> : null}
        </div>

        <div className="md:col-span-2">
          <label className={labelClass}>Address</label>
          <textarea rows="3" className={inputClass} {...register('customer.address')} />
          {errors.customer?.address ? <p className="mt-1 text-sm text-rose-500">{errors.customer.address.message}</p> : null}
        </div>

        <div>
          <label className={labelClass}>Country</label>
          <input className={inputClass} {...register('customer.country')} />
          {errors.customer?.country ? <p className="mt-1 text-sm text-rose-500">{errors.customer.country.message}</p> : null}
        </div>

        <div>
          <label className={labelClass}>State</label>
          <input className={inputClass} {...register('customer.state')} />
          {errors.customer?.state ? <p className="mt-1 text-sm text-rose-500">{errors.customer.state.message}</p> : null}
        </div>

        <div>
          <label className={labelClass}>City</label>
          <input className={inputClass} {...register('customer.city')} />
          {errors.customer?.city ? <p className="mt-1 text-sm text-rose-500">{errors.customer.city.message}</p> : null}
        </div>

        <div>
          <label className={labelClass}>Pincode</label>
          <input className={inputClass} {...register('customer.pincode', { pattern: { value: /^[0-9]{4,8}$/, message: 'Enter a valid pincode' } })} />
          {errors.customer?.pincode ? <p className="mt-1 text-sm text-rose-500">{errors.customer.pincode.message}</p> : null}
        </div>

        <div>
          <label className={labelClass}>GST Number</label>
          <input className={inputClass} {...register('customer.gstNumber', { pattern: { value: /^[0-9A-Z]{15}$/i, message: 'Enter a valid GST number' } })} />
          {errors.customer?.gstNumber ? <p className="mt-1 text-sm text-rose-500">{errors.customer.gstNumber.message}</p> : null}
        </div>

        <div>
          <label className={labelClass}>Phone Number</label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-3 text-slate-400" size={16} />
            <input className={`${inputClass} pl-10`} {...register('customer.phone', { pattern: { value: /^[0-9+\-()\s]{7,15}$/, message: 'Enter a valid phone number' } })} />
          </div>
          {errors.customer?.phone ? <p className="mt-1 text-sm text-rose-500">{errors.customer.phone.message}</p> : null}
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
