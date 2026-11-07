import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, KeyRound, LoaderCircle, UserRound } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import toast from 'react-hot-toast';
import AuthLayout from '../components/AuthLayout';

const Login = () => {
  const navigate = useNavigate();
  const { login, sessionExpired } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ username: form.username.trim(), password: form.password });
      toast.success('Logged in successfully');
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Sign in to Ledger."
      description="Enter your account details to continue to your billing workspace."
      variant="auth"
    >
        {sessionExpired ? (
          <p role="status" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
            Your session expired. Please sign in again to continue.
          </p>
        ) : null}
        <form className="space-y-5" onSubmit={handleSubmit} aria-busy={loading}>
          <label htmlFor="login-username" className="block text-sm font-semibold text-slate-800">
            Username
            <span className="relative mt-2 block">
              <UserRound size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
              <input
                id="login-username"
                name="username"
                className="min-h-12 w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-base font-normal text-slate-950 shadow-sm outline-none transition placeholder:text-slate-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/25"
                value={form.username}
                onChange={(event) => setForm({ ...form, username: event.target.value })}
                placeholder="Enter your username"
                autoComplete="username"
                required
              />
            </span>
          </label>

          <label htmlFor="login-password" className="block text-sm font-semibold text-slate-800">
            Password
            <span className="relative mt-2 block">
              <KeyRound size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
              <input
                id="login-password"
                name="password"
                type={passwordVisible ? 'text' : 'password'}
                className="min-h-12 w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-12 text-base font-normal text-slate-950 shadow-sm outline-none transition placeholder:text-slate-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/25"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                placeholder="Enter your password"
                autoComplete="current-password"
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
          </label>

          {error ? <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm leading-6 text-rose-800">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:scale-[1.01] hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
          >
            {loading ? (
              <>
                <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />
                Signing in...
              </>
            ) : 'Sign in'}
          </button>
        </form>

        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <Link to="/forgot-password" className="inline-flex min-h-11 items-center rounded-lg font-semibold text-emerald-800 underline-offset-4 transition hover:text-emerald-950 hover:underline">
            Forgot password?
          </Link>
          <Link to="/register" className="inline-flex min-h-11 items-center justify-end rounded-lg text-right font-semibold text-emerald-800 underline-offset-4 transition hover:text-emerald-950 hover:underline">
            Create account
          </Link>
        </div>

        <div className="mt-4 text-center">
          <Link
            to="/landing"
            className="text-xs text-slate-400 underline transition hover:text-slate-600"
          >
            Back to landing
          </Link>
        </div>
    </AuthLayout>
  );
};

export default Login;
