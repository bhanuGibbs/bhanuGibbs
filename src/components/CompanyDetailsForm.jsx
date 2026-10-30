import { Building2, Mail, Phone, Globe, MapPin, BadgeCheck } from 'lucide-react';
import { digitsOnly, PHONE_NUMBER_REGEX, PINCODE_REGEX } from '../utils/numericInput';

const inputClass = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100';
const labelClass = 'mb-2 block text-sm font-medium text-slate-700';

const CompanyDetailsForm = ({ register, errors, watch, setValue }) => {
  const logoPreview = watch('company.logoPreview');

  const handleLogoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setValue('company.logo', reader.result, { shouldDirty: true, shouldValidate: true });
      setValue('company.logoPreview', reader.result, { shouldDirty: true, shouldValidate: true });
    };
    reader.readAsDataURL(file);
  };

  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-soft sm:p-7">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-2xl bg-brand-50 p-3 text-brand-600">
          <Building2 size={18} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Company Details</h2>
          <p className="text-sm text-slate-500">Add your company identity and contact information.</p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className={labelClass}>Company Logo</label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-brand-500 hover:text-brand-600">
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              Upload Logo
            </label>
            {logoPreview ? (
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                <img src={logoPreview} alt="Company logo preview" className="h-full w-full object-cover" />
              </div>
            ) : null}
          </div>
        </div>

        <div className="md:col-span-2">
          <label className={labelClass}>Company Name</label>
          <input className={inputClass} {...register('company.name')} />
          {errors.company?.name ? <p className="mt-1 text-sm text-rose-500">{errors.company.name.message}</p> : null}
        </div>

        <div className="md:col-span-2">
          <label className={labelClass}>Address</label>
          <textarea rows="3" className={inputClass} {...register('company.address')} />
          {errors.company?.address ? <p className="mt-1 text-sm text-rose-500">{errors.company.address.message}</p> : null}
        </div>

        <div>
          <label className={labelClass}>Country</label>
          <input className={inputClass} {...register('company.country')} />
          {errors.company?.country ? <p className="mt-1 text-sm text-rose-500">{errors.company.country.message}</p> : null}
        </div>

        <div>
          <label className={labelClass}>State</label>
          <input className={inputClass} {...register('company.state')} />
          {errors.company?.state ? <p className="mt-1 text-sm text-rose-500">{errors.company.state.message}</p> : null}
        </div>

        <div>
          <label className={labelClass}>City</label>
          <input className={inputClass} {...register('company.city')} />
          {errors.company?.city ? <p className="mt-1 text-sm text-rose-500">{errors.company.city.message}</p> : null}
        </div>

        <div>
          <label className={labelClass}>Pincode</label>
          <input className={inputClass} inputMode="numeric" maxLength={6} {...register('company.pincode', { pattern: { value: PINCODE_REGEX, message: 'Pincode must be exactly 6 digits' }, onChange: (event) => { event.target.value = digitsOnly(event.target.value, 6); } })} />
          {errors.company?.pincode ? <p className="mt-1 text-sm text-rose-500">Please provide valid data: enter a 6-digit PIN code.</p> : null}
        </div>

        <div>
          <label className={labelClass}>GSTIN</label>
          <input className={inputClass} {...register('company.gstin', { pattern: { value: /^[0-9A-Z]{15}$/i, message: 'Enter a valid GSTIN' } })} />
          {errors.company?.gstin ? <p className="mt-1 text-sm text-rose-500">{errors.company.gstin.message}</p> : null}
        </div>

        <div>
          <label className={labelClass}>Phone Number</label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-3 text-slate-400" size={16} />
            <input className={`${inputClass} pl-10`} type="tel" inputMode="numeric" maxLength={10} {...register('company.phone', { pattern: { value: PHONE_NUMBER_REGEX, message: 'Please provide valid data: enter a 10-digit mobile number.' }, onChange: (event) => { event.target.value = digitsOnly(event.target.value, 10); } })} />
          </div>
          {errors.company?.phone ? <p className="mt-1 text-sm text-rose-500">Please provide valid data: enter a 10-digit mobile number.</p> : null}
        </div>

        <div>
          <label className={labelClass}>Email</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-3 text-slate-400" size={16} />
            <input className={`${inputClass} pl-10`} {...register('company.email', { pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' } })} />
          </div>
          {errors.company?.email ? <p className="mt-1 text-sm text-rose-500">{errors.company.email.message}</p> : null}
        </div>

        <div className="md:col-span-2">
          <label className={labelClass}>Website</label>
          <div className="relative">
            <Globe className="pointer-events-none absolute left-3 top-3 text-slate-400" size={16} />
            <input className={`${inputClass} pl-10`} {...register('company.website')} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default CompanyDetailsForm;
