import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { setupCompany } from '../integration/backend/auth';

const SetupCompany = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [form, setForm] = useState({
    name: '',
    address: '',
    phone_number: '',
    email: '',
    website: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await setupCompany({
        name: form.name.trim(),
        address: form.address.trim() || undefined,
        phone_number: form.phone_number.trim() || undefined,
        email: form.email.trim() || undefined,
        website: form.website.trim() || undefined,
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
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-lg rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft">
        <h1 className="text-2xl font-semibold text-slate-900">Complete company setup</h1>
        <p className="mt-2 text-sm text-slate-500">Enter your company details to continue using the app.</p>
        <p className="mt-3 rounded-2xl border-l-4 border-brand-500 bg-brand-50 px-4 py-3 text-sm text-slate-700">
          This step is required before you can access quotation creation and PDF generation features.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700">
            Company name
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white"
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
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white"
              value={form.address}
              onChange={(event) => setForm({ ...form, address: event.target.value })}
              placeholder="Enter company address"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Phone number
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white"
              value={form.phone_number}
              onChange={(event) => setForm({ ...form, phone_number: event.target.value })}
              placeholder="Enter phone number"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              type="email"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="Enter company email"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Website
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white"
              value={form.website}
              onChange={(event) => setForm({ ...form, website: event.target.value })}
              placeholder="Enter website URL"
            />
          </label>

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Saving...' : 'Save company details'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetupCompany;
