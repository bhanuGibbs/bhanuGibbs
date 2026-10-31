import { useState, useMemo } from 'react';
import { Building2, ChevronDown, Mail, Phone, Globe } from 'lucide-react';
import { digitsOnly, nameOnly, NAME_REGEX, PHONE_NUMBER_REGEX, PINCODE_REGEX, URL_REGEX, GSTIN_REGEX, preventPaste } from '../utils/numericInput';
import { indianStates, getCitiesForState } from '../utils/indianStates';

const inputClass = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';
const selectClass = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60';
const labelClass = 'mb-2 block text-sm font-medium text-slate-700';

const CompanyDetailsForm = ({ register, errors, watch, setValue }) => {
  const [collapsed, setCollapsed] = useState(true);
  const [country, setCountry] = useState('India');
  const [selectedState, setSelectedState] = useState('');
  const cities = useMemo(() => getCitiesForState(selectedState), [selectedState]);
  const logoPreview = watch('company.logoPreview');

  const handleLogoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PNG, JPEG, WebP, or SVG image.');
      event.target.value = '';
      return;
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size must be under 2MB.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setValue('company.logo', reader.result, { shouldDirty: true, shouldValidate: true });
      setValue('company.logoPreview', reader.result, { shouldDirty: true, shouldValidate: true });
    };
    reader.readAsDataURL(file);
  };

  return (
    <section className={`rounded-2xl border border-slate-200/60 bg-white ${collapsed ? 'pb-5 sm:pb-7' : ''}`}>
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center gap-3 p-5 sm:p-7"
      >
        <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
          <Building2 size={18} />
        </div>
        <div className="flex-1 text-left">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">Company Details</h2>
          <p className="mt-1 text-sm text-slate-500">Your business information that appears on documents.</p>
        </div>
        <ChevronDown size={20} className={`text-slate-400 transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`} />
      </button>

      {!collapsed && (
        <div className="grid gap-5 border-t border-slate-200/60 px-5 pb-5 pt-5 md:grid-cols-2 sm:px-7 sm:pb-7 sm:pt-5">
        <div className="md:col-span-2">
          <label className={labelClass}>Company Logo</label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-emerald-500 hover:text-emerald-700">
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
          <input className={inputClass} {...register('company.name', { pattern: { value: NAME_REGEX, message: 'Please enter only alphabetic characters' }, onChange: (event) => { event.target.value = nameOnly(event.target.value); } })} />
          {errors.company?.name ? <p className="mt-1 text-sm text-rose-500">{errors.company.name.message}</p> : null}
        </div>

        <div className="md:col-span-2">
          <label className={labelClass}>Address</label>
          <textarea rows="3" className={inputClass} {...register('company.address')} />
          {errors.company?.address ? <p className="mt-1 text-sm text-rose-500">{errors.company.address.message}</p> : null}
        </div>

        <div>
          <label className={labelClass}>Country</label>
          <select className={selectClass} value={country} onChange={(event) => { setCountry(event.target.value); setValue('company.country', event.target.value, { shouldValidate: true }); }}>
            <option value="India">India</option>
          </select>
          {errors.company?.country ? <p className="mt-1 text-sm text-rose-500">{errors.company.country.message}</p> : null}
        </div>

        <div>
          <label className={labelClass}>State</label>
          <select className={selectClass} value={selectedState || ''} onChange={(event) => { setSelectedState(event.target.value); setValue('company.state', event.target.value || '', { shouldValidate: true }); setValue('company.city', '', { shouldValidate: true }); }}>
            <option value="">Select state</option>
            {indianStates.map((state) => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
          {errors.company?.state ? <p className="mt-1 text-sm text-rose-500">{errors.company.state.message}</p> : null}
        </div>

        <div>
          <label className={labelClass}>City</label>
          <select className={selectClass} value={watch('company.city') || ''} onChange={(event) => { setValue('company.city', event.target.value || '', { shouldValidate: true }); }} disabled={!selectedState}>
            <option value="">Select city</option>
            {cities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
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
            <input className={`${inputClass} pl-10`} type="url" {...register('company.website', { pattern: { value: URL_REGEX, message: 'Enter a valid website URL' } })} />
          </div>
          {errors.company?.website ? <p className="mt-1 text-sm text-rose-500">{errors.company.website.message}</p> : null}
        </div>
      </div>
      )}
    </section>
  );
};

export default CompanyDetailsForm;
