import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { verifyEmail, resendVerificationEmail } from '../integration/backend/auth';
import AuthLayout from '../components/AuthLayout';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  // Auto-verify if token is present
  useEffect(() => {
    if (!token) return;

    const doVerify = async () => {
      setLoading(true);
      try {
        await verifyEmail(token);
        setVerified(true);
        setMessage('Email verified successfully! You can now log in.');
        toast.success('Email verified successfully');
      } catch (err) {
        setError(err.message || 'Email verification failed. The link may be expired.');
        toast.error('Verification failed');
      } finally {
        setLoading(false);
      }
    };

    doVerify();
  }, [token]);

  const handleResend = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!resendEmail) {
      setError('Please enter your email address.');
      return;
    }

    setResendLoading(true);
    try {
      await resendVerificationEmail(resendEmail);
      setMessage('Verification email sent! Check your inbox.');
      toast.success('Verification email sent');
    } catch (err) {
      setError(err.message || 'Failed to resend verification email.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Verify your email"
      title="Confirm your email address."
      description="We need to verify your email before you can access your account."
    >
      {verified ? (
        <div className="space-y-6">
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            <p className="font-semibold">✓ Email verified!</p>
            <p className="mt-1">{message}</p>
          </div>
          <Link
            to="/login"
            className="block w-full rounded-lg bg-[#1E3A5F] px-4 py-3 text-sm font-semibold text-white text-center transition hover:bg-[#162d4a]"
          >
            Go to login
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {loading && (
            <div className="rounded-lg border border-[#1E3A5F]/10 bg-[#1E3A5F]/5 p-4 text-sm text-[#1E3A5F]">
              <p>Verifying your email...</p>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              <p className="font-semibold">Verification failed</p>
              <p className="mt-1">{error}</p>
            </div>
          )}

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-semibold">Didn't receive the email?</p>
            <p className="mt-1">Check your spam folder or request a new verification email below.</p>
          </div>

          <form onSubmit={handleResend} className="space-y-4">
            <label className="block text-sm font-medium text-[#1E3A5F]">
              Email address
              <input
                type="email"
                className="mt-2 w-full rounded-lg border border-[#2D3748]/20 bg-white px-4 py-3 text-sm text-[#1E3A5F] outline-none transition focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/25"
                value={resendEmail}
                onChange={(event) => setResendEmail(event.target.value)}
                placeholder="Enter your email"
                required
              />
            </label>

            <button
              type="submit"
              disabled={resendLoading}
              className="w-full rounded-lg bg-[#1E3A5F] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#162d4a] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {resendLoading ? 'Sending...' : 'Resend verification email'}
            </button>
          </form>

          {message && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              <p>{message}</p>
            </div>
          )}

          <p className="text-center text-sm text-[#2D3748]/60">
            <Link to="/login" className="font-semibold text-[#FF6B35] hover:text-[#e55a28]">
              Back to login
            </Link>
            {' · '}
            <Link to="/register" className="font-semibold text-[#FF6B35] hover:text-[#e55a28]">
              Register
            </Link>
          </p>
        </div>
      )}
    </AuthLayout>
  );
};

export default VerifyEmail;
