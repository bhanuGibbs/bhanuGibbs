import { useState } from 'react';
import { Link , useNavigate} from 'react-router-dom';
import toast from 'react-hot-toast';
import { fetchApi, readApiError } from '../utils/apiErrors';

const ForgotPassword = () => {
  const navigate = useNavigate();
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
    <div className="forgot-password-page min-h-screen bg-[#f7f8fa] px-4 py-10 sm:px-6">
      <style>{`
        .forgot-password-page ::selection { background: #d1fae5; color: #065f46; }
        .forgot-password-page ::-moz-selection { background: #d1fae5; color: #065f46; }
        .forgot-password-page ::-webkit-scrollbar { width: 8px; height: 8px; }
        .forgot-password-page ::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
        .forgot-password-page ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .forgot-password-page ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
      <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200/60 bg-white p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Forgot password</h1>
        <p className="mt-2 text-sm text-slate-500">Enter your email to receive password reset instructions.</p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              type="email"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              required
            />
          </label>

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-600">{message}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Sending...' : 'Send reset instructions'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Remembered your password?{' '}
          <Link to="/login" className="font-semibold text-emerald-700 hover:text-emerald-800">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
