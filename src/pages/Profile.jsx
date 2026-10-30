import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import { useAuth } from '../context/useAuth';
import { updateCurrentUser } from '../integration/backend/auth';
import { digitsOnly } from '../utils/numericInput';

const Profile = () => {
  const { user, logout, refreshUser } = useAuth();
  const [form, setForm] = useState({ username: '', email: '', mobile_number: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      username: user?.username || '',
      email: user?.email || '',
      mobile_number: user?.mobile_number || '',
    });
  }, [user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await updateCurrentUser({
        username: form.username.trim(),
        email: form.email.trim(),
        mobile_number: form.mobile_number.trim() || null,
      });
      await refreshUser();
      toast.success('Your profile was updated.');
    } catch (error) {
      toast.error(error.message || 'Unable to update your profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header user={user} onLogout={logout} />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Account settings</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">My profile</h1>
          <p className="mt-1 text-sm text-slate-500">Update your own account details. Your role and workspace access are managed separately.</p>
        </div>
        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Username
              <input
                required
                minLength={3}
                maxLength={100}
                name="username"
                value={form.username}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Email
              <input
                required
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Mobile number
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                pattern="[0-9]{10}"
                title="Please provide valid data: enter a 10-digit mobile number."
                name="mobile_number"
                value={form.mobile_number}
                onChange={(event) => setForm((current) => ({ ...current, mobile_number: digitsOnly(event.target.value, 10) }))}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Role</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{user?.role || 'Viewer'}</p>
              <p className="mt-1 text-xs text-slate-500">Role changes are not available from profile settings.</p>
            </div>
            <div className="rounded-xl bg-emerald-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Subscription plan</p>
              <p className="mt-1 text-sm font-semibold capitalize text-slate-800">{user?.subscription_plan || 'free'}</p>
              <p className="mt-1 text-xs text-slate-600">
                {user?.subscription_plan === 'premium'
                  ? 'Unlimited finalized quotations and invoices.'
                  : user?.subscription_plan === 'basic'
                    ? 'Up to 50 finalized quotations and invoices per month.'
                    : 'Up to 10 finalized quotations and invoices per month.'}
              </p>
              <p className="mt-1 text-xs text-slate-500">Plan changes are managed by an administrator.</p>
            </div>
          </div>
          <div className="mt-7 flex justify-end border-t border-slate-100 pt-5">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default Profile;
