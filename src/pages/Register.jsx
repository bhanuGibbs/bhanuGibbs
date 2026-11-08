import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AtSign, Eye, EyeOff, KeyRound, LoaderCircle, Phone, UserRound } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import toast from 'react-hot-toast';
import AuthLayout from '../components/AuthLayout';
import { digitsOnly, preventPaste, getPasswordError } from '../utils/numericInput';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    mobile_number: '',
    business_profile: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setPasswordError('');

    const pwErr = getPasswordError(form.password);
    if (pwErr) {
      setPasswordError(pwErr);
      return;
    }

    setLoading(true);

    try {
      await register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        mobile_number: form.mobile_number.trim() || undefined,
        business_profile: form.business_profile,
      });
      toast.success('Account created! Please check your email to verify your account.');
      navigate('/verify-email');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Create your workspace"
      title="Good business starts here."
      description="Choose the workspace that fits your business, then set up your account."
      variant="auth"
    >
        <form className="space-y-4" onSubmit={handleSubmit} aria-busy={loading}>
          <label htmlFor="register-username" className="block text-sm font-semibold text-slate-800">
            Username
            <span className="relative mt-2 block">
              <UserRound size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
              <input
                id="register-username"
                name="username"
                className="min-h-12 w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-base font-normal text-slate-950 shadow-sm outline-none transition placeholder:text-slate-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/25"
                value={form.username}
                onChange={(event) => setForm({ ...form, username: event.target.value })}
                placeholder="Choose a username"
                autoComplete="username"
                required
              />
            </span>
          </label>

          <label htmlFor="register-email" className="block text-sm font-semibold text-slate-800">
            Email
            <span className="relative mt-2 block">
              <AtSign size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
              <input
                id="register-email"
                name="email"
                type="email"
                className="min-h-12 w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-base font-normal text-slate-950 shadow-sm outline-none transition placeholder:text-slate-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/25"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                placeholder="Enter your email"
                autoComplete="email"
                required
              />
            </span>
          </label>

          <label htmlFor="register-mobile" className="block text-sm font-semibold text-slate-800">
            Mobile number
            <span className="relative mt-2 block">
              <Phone size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
              <input
                id="register-mobile"
                name="mobile_number"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                pattern="[0-9]{10}"
                title="Please provide valid data: enter a 10-digit mobile number."
                className="min-h-12 w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-base font-normal text-slate-950 shadow-sm outline-none transition placeholder:text-slate-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/25"
                value={form.mobile_number}
                onChange={(event) => setForm({ ...form, mobile_number: digitsOnly(event.target.value, 10) })}
                onPaste={preventPaste}
                placeholder="Optional mobile number"
                autoComplete="tel"
              />
            </span>
          </label>

          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-slate-800">
              Choose your workspace <span className="text-rose-700">Required</span>
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                ['invoice', 'Invoice / Quotation', 'Create invoices and quotations for customers'],
                ['pos', 'POS Billing', 'Point-of-sale billing and stock tools'],
                ['delivery_challan', 'Delivery Challan', 'Prepare agricultural-seed delivery challans'],
                ['sales_inventory', 'Sales & Inventory Management', 'Manage organization sales, orders, and inventory'],
              ].map(([value, title, description]) => (
                <label
                  key={value}
                  className={`cursor-pointer rounded-xl border p-3 transition focus-within:ring-2 focus-within:ring-emerald-700 focus-within:ring-offset-2 ${
                    form.business_profile === value
                      ? 'border-emerald-700 bg-emerald-50'
                      : 'border-slate-300 bg-white hover:border-slate-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="business_profile"
                    value={value}
                    checked={form.business_profile === value}
                    onChange={() => setForm({ ...form, business_profile: value })}
                    required
                    className="sr-only"
                  />
                  <span className="block text-sm font-semibold text-slate-900">{title}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-600">{description}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label htmlFor="register-password" className="block text-sm font-semibold text-slate-800">
            Password
            <span className="relative mt-2 block">
              <KeyRound size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
              <input
                id="register-password"
                name="password"
                type={passwordVisible ? 'text' : 'password'}
                minLength={8}
                className="password-visibility-toggle min-h-12 w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-12 text-base font-normal text-slate-950 shadow-sm outline-none transition placeholder:text-slate-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/25"
                value={form.password}
                onChange={(event) => {
                  setForm({ ...form, password: event.target.value });
                  setPasswordError('');
                }}
                placeholder="Create a strong password"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setPasswordVisible((visible) => !visible)}
                className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                aria-pressed={passwordVisible}
              >
                {passwordVisible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </span>
            <span className="mt-1 block text-xs font-normal leading-5 text-slate-600">
              At least 8 characters with uppercase, lowercase, a number, and a special character.
            </span>
          </label>

          {passwordError ? <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm leading-6 text-rose-800">{passwordError}</p> : null}
          {error ? <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm leading-6 text-rose-800">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:scale-[1.01] hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
          >
            {loading ? (
              <>
                <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />
                Setting up your workspace…
              </>
            ) : 'Create account'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-700">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-emerald-800 underline-offset-4 transition hover:text-emerald-950 hover:underline">
            Sign in
          </Link>
        </p>
    </AuthLayout>
  );
};

export default Register;
