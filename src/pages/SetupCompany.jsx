import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { setupCompany } from '../integration/backend/auth';
import AuthLayout from '../components/AuthLayout';

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
    country: '',
    state: '',
    city: '',
    pincode: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Enter company name"
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
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
              value={form.phone_number}
              onChange={(event) => setForm({ ...form, phone_number: event.target.value })}
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
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
              value={form.website}
              onChange={(event) => setForm({ ...form, website: event.target.value })}
              placeholder="Enter website URL"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            {[
              ['city', 'City'],
              ['state', 'State'],
              ['country', 'Country'],
              ['pincode', 'Postal code'],
            ].map(([field, label]) => (
              <label key={field} className="block text-sm font-medium text-slate-700">
                {label}
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
                  value={form[field]}
                  onChange={(event) => setForm({ ...form, [field]: event.target.value })}
                  placeholder={label}
                />
              </label>
            ))}
          </div>

          <label className="block text-sm font-medium text-slate-700">
            GSTIN / Tax ID <span className="font-normal text-slate-400">· Optional</span>
            <input
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
              value={form.gstin}
              onChange={(event) => setForm({ ...form, gstin: event.target.value.toUpperCase() })}
              placeholder="Your business tax registration number"
            />
          </label>

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Saving...' : 'Save company details'}
          </button>
        </form>
    </AuthLayout>
  );
};

export default SetupCompany;
