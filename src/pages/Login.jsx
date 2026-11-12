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
          <label htmlFor="login-username" className="block text-sm font-semibold text-[#1E3A5F]">
            Username
            <span className="relative mt-2 block">
              <UserRound size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#2D3748]/40" aria-hidden="true" />
              <input
                id="login-username"
                name="username"
                className="min-h-12 w-full rounded-lg border border-[#2D3748]/20 bg-white py-3 pl-11 pr-4 text-base font-normal text-[#1E3A5F] shadow-sm outline-none transition placeholder:text-[#2D3748]/40 focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/25"
                value={form.username}
                onChange={(event) => setForm({ ...form, username: event.target.value })}
                placeholder="Enter your username"
                autoComplete="username"
                required
              />
            </span>
          </label>

          <label htmlFor="login-password" className="block text-sm font-semibold text-[#1E3A5F]">
            Password
            <span className="relative mt-2 block">
              <KeyRound size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#2D3748]/40" aria-hidden="true" />
              <input
                id="login-password"
                name="password"
                type={passwordVisible ? 'text' : 'password'}
                className="password-visibility-toggle min-h-12 w-full rounded-lg border border-[#2D3748]/20 bg-white py-3 pl-11 pr-12 text-base font-normal text-[#1E3A5F] shadow-sm outline-none transition placeholder:text-[#2D3748]/40 focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/25"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setPasswordVisible((visible) => !visible)}
                className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-[#2D3748]/60 transition hover:bg-[#1E3A5F]/5 hover:text-[#1E3A5F]"
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
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1E3A5F] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:scale-[1.01] hover:bg-[#162d4a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF6B35] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
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
          <Link to="/forgot-password" className="inline-flex min-h-11 items-center rounded-lg font-semibold text-[#FF6B35] underline-offset-4 transition hover:text-[#e55a28] hover:underline">
            Forgot password?
          </Link>
          <Link to="/register" className="inline-flex min-h-11 items-center justify-end rounded-lg text-right font-semibold text-[#FF6B35] underline-offset-4 transition hover:text-[#e55a28] hover:underline">
            Create account
          </Link>
        </div>

        <div className="mt-4 text-center">
          <Link
            to="/landing"
            className="text-xs text-[#2D3748]/40 underline transition hover:text-[#2D3748]/60"
          >
            Back to landing
          </Link>
        </div>
    </AuthLayout>
  );
};

export default Login;
