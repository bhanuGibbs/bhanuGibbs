import { useEffect, useState } from 'react';
import { getStoredToken, getStoredUser, loginUser, logoutUser, registerUser } from './auth';

const AuthGate = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    setIsAuthenticated(Boolean(token));
    setUser(getStoredUser());
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        await registerUser({ username: form.username, email: form.email, password: form.password, roleName: 'Viewer' });
        await loginUser({ username: form.username, password: form.password });
      } else {
        await loginUser({ username: form.username, password: form.password });
      }

      const nextUser = getStoredUser();
      setUser(nextUser);
      setIsAuthenticated(true);
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f7f8fa]">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200/60 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-base font-bold text-emerald-700">
                {(user?.username || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Logged in as</p>
                <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">{user?.username || 'User'}</h3>
                <p className="text-sm text-slate-600">{user?.email || 'No email available'}</p>
                <span className="mt-1 inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  {user?.role || 'Viewer'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                logoutUser();
                setUser(null);
                setIsAuthenticated(false);
              }}
              className="rounded-xl border border-slate-200/60 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Logout
            </button>
          </div>
        </div>

        {children}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f8fa] px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/60 bg-white p-6">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{mode === 'register' ? 'Create account' : 'Login'}</h2>
        <p className="mt-2 text-sm text-slate-500">Use your backend account to access the quotation software.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            placeholder="Username"
            value={form.username}
            onChange={(event) => setForm({ ...form, username: event.target.value })}
            required
          />

          {mode === 'register' ? (
            <input
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          ) : null}

          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            required
          />

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}

          <button type="submit" disabled={loading} className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-70">
            {loading ? 'Please wait...' : mode === 'register' ? 'Register' : 'Login'}
          </button>
        </form>

        <button type="button" onClick={() => setMode(mode === 'register' ? 'login' : 'register')} className="mt-4 text-sm font-semibold text-emerald-700 hover:text-emerald-800">
          {mode === 'register' ? 'Already have an account? Login' : 'Need an account? Register'}
        </button>
      </div>
    </div>
  );
};

export default AuthGate;
