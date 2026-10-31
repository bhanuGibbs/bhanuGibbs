import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/useAuth';
import { setupCompany } from '../integration/backend/auth';
import AuthLayout from '../components/AuthLayout';
import { digitsOnly, nameOnly, NAME_REGEX, GSTIN_REGEX, URL_REGEX, preventPaste } from '../utils/numericInput';
import { indianStates, getCitiesForState } from '../utils/indianStates';

const SetupCompany = () => {
  const navigate = useNavigate();
  const { refreshUser, user } = useAuth();
  const [form, setForm] = useState({
    name: '',
    address: '',
    phone_number: user?.mobile_number || '',
    email: user?.email || '',
    website: '',
    gstin: '',
    country: 'India',
    state: '',
    city: '',
    pincode: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const cities = useMemo(() => getCitiesForState(selectedState), [selectedState]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      let website = form.website.trim();
      if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`;
      await setupCompany({
        name: form.name.trim(),
        address: form.address.trim() || undefined,
        phone_number: form.phone_number.trim() || undefined,
        email: form.email.trim() || undefined,
        website: website || undefined,
        gstin: form.gstin.trim() || undefined,
        country: form.country.trim() || undefined,
        state: form.state.trim() || undefined,
        city: form.city.trim() || undefined,
        pincode: form.pincode.trim() || undefined,
      });
      await refreshUser();
      toast.success('Company details saved successfully');
      navigate('/');
    } catch (err) {
      setError(err.message || 'Unable to save company details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="One last step"
      title="Tell us about your business."
      description="These details are saved to your company profile and added to the business documents you create."
    >
        <p className="mb-6 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900">
          Your account is ready. Add your company details once and they’ll automatically appear on your invoices and quotations.
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700">
            Company name
            <input
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: nameOnly(event.target.value) })}
              placeholder="Enter company name"
              pattern={NAME_REGEX.source}
              title="Please enter only alphabetic characters"
              required
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Address
            <textarea
              rows="3"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
              value={form.address}
              onChange={(event) => setForm({ ...form, address: event.target.value })}
              placeholder="Enter company address"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Phone number
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              pattern="[0-9]{10}"
              title="Please provide valid data: enter a 10-digit mobile number."
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
              value={form.phone_number}
              onChange={(event) => setForm({ ...form, phone_number: digitsOnly(event.target.value, 10) })}
              onPaste={preventPaste}
              placeholder="Enter phone number"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              type="email"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="Enter company email"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Website
            <input
              type="url"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
              value={form.website}
              onChange={(event) => setForm({ ...form, website: event.target.value })}
              placeholder="Enter website URL"
              pattern={URL_REGEX.source}
              title="Please enter a valid website URL (e.g., example.com or https://example.com)"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm font-medium text-slate-700">
              Country
              <select
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
                value={form.country || 'India'}
                onChange={(event) => setForm({ ...form, country: event.target.value })}
              >
                <option value="India">India</option>
              </select>
            </label>

            <label className="block text-sm font-medium text-slate-700">
              State
              <select
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
                value={selectedState || ''}
                onChange={(event) => { setSelectedState(event.target.value); setForm({ ...form, state: event.target.value || '', city: '' }); }}
              >
                <option value="">Select state</option>
                {indianStates.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium text-slate-700">
              City
              <select
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                value={form.city || ''}
                onChange={(event) => setForm({ ...form, city: event.target.value || '' })}
                disabled={!selectedState}
              >
                <option value="">Select city</option>
                {cities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Postal code
              <input
                inputMode="numeric"
                maxLength={6}
                pattern="[0-9]{6}"
                title="Please provide valid data: enter a 6-digit PIN code."
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
                value={form.pincode}
                onChange={(event) => setForm({ ...form, pincode: digitsOnly(event.target.value, 6) })}
                onPaste={preventPaste}
                placeholder="Postal code"
              />
            </label>
          </div>

          <label className="block text-sm font-medium text-slate-700">
            GSTIN / Tax ID <span className="font-normal text-slate-400">· Optional</span>
            <input
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
              value={form.gstin}
              onChange={(event) => setForm({ ...form, gstin: event.target.value.toUpperCase() })}
              placeholder="Your business tax registration number"
              maxLength={15}
              pattern={GSTIN_REGEX.source}
              title="Enter a valid 15-character GSTIN"
            />
          </label>

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Saving...' : 'Save company details'}
          </button>
        </form>
    </AuthLayout>
  );
};

export default SetupCompany;
