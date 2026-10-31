import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { resetPassword } from '../integration/backend/auth';
import { getPasswordError } from '../utils/numericInput';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setPasswordError('');

    if (!token) {
      setError('Reset token is required.');
      return;
    }

    const pwErr = getPasswordError(password);
    if (pwErr) {
      setPasswordError(pwErr);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ token, new_password: password });
      setMessage('Password reset successful. You can now login.');
      toast.success('Password updated successfully');
    } catch (err) {
      setError(err.message || 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-page min-h-screen bg-[#f7f8fa] px-4 py-10 sm:px-6">
      <style>{`
        .reset-password-page ::selection { background: #d1fae5; color: #065f46; }
        .reset-password-page ::-moz-selection { background: #d1fae5; color: #065f46; }
        .reset-password-page ::-webkit-scrollbar { width: 8px; height: 8px; }
        .reset-password-page ::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
        .reset-password-page ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .reset-password-page ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
      <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200/60 bg-white p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Reset your password</h1>
        <p className="mt-2 text-sm text-slate-500">Enter a new password to regain access to your account.</p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700">
            New password
            <input
              type="password"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setPasswordError('');
              }}
              placeholder="New password"
              required
            />
            <p className="mt-1 text-xs text-slate-500">
              At least 8 characters with uppercase, lowercase, a number, and a special character.
            </p>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Confirm password
            <input
              type="password"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm password"
              required
            />
          </label>

          {passwordError ? <p className="text-sm text-rose-600">{passwordError}</p> : null}
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-600">{message}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Resetting...' : 'Reset password'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link to="/login" className="font-semibold text-emerald-700 hover:text-emerald-800">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
