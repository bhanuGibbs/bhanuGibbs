import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AtSign, LoaderCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchApi, readApiError } from '../utils/apiErrors';
import AuthLayout from '../components/AuthLayout';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetchApi('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!response.ok) {
        throw await readApiError(response, 'Unable to send reset instructions. Please try again.');
      }

      const payload = await response.json();
      setMessage(payload.message || 'If the email exists, a reset link has been sent.');
      setResetToken(payload.reset_token || '');
      toast.success('If the account exists, instructions were sent');
    } catch (err) {
      setError(err.message || 'Unable to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Account recovery"
      title="Reset your password."
      description="Enter the email address linked to your account and we’ll send password reset instructions."
      variant="auth"
    >
      <form className="space-y-5" onSubmit={handleSubmit} aria-busy={loading}>
        <label htmlFor="forgot-password-email" className="block text-sm font-semibold text-slate-800">
          Email
          <span className="relative mt-2 block">
            <AtSign size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
            <input
              id="forgot-password-email"
              name="email"
              type="email"
              className="min-h-12 w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-base font-normal text-slate-950 shadow-sm outline-none transition placeholder:text-slate-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/25"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
              required
            />
          </span>
        </label>

        {error ? <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm leading-6 text-rose-800">{error}</p> : null}
        {message ? <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm leading-6 text-emerald-950">{message}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:scale-[1.01] hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
        >
          {loading ? (
            <>
              <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />
              Sending...
            </>
          ) : 'Send reset instructions'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-700">
        Remembered your password?{' '}
        <Link to="/login" className="font-semibold text-emerald-800 underline-offset-4 transition hover:text-emerald-950 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
};

export default ForgotPassword;
