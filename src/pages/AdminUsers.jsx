import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import { useAuth } from '../context/useAuth';
import { getAdminUsers, updateUserPlan } from '../integration/backend/api';

const planOptions = [
  { value: 'free', label: 'Free — 10 per month' },
  { value: 'basic', label: 'Basic — 50 per month' },
  { value: 'premium', label: 'Premium — unlimited' },
];

const AdminUsers = () => {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setUsers(await getAdminUsers());
      } catch (error) {
        toast.error(error.message || 'Unable to load users');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const handlePlanChange = async (userId, subscriptionPlan) => {
    setUpdatingId(userId);
    try {
      const updatedUser = await updateUserPlan(userId, subscriptionPlan);
      setUsers((current) =>
        current.map((item) => (item.id === userId ? updatedUser : item)),
      );
      toast.success('Subscription plan updated.');
    } catch (error) {
      toast.error(error.message || 'Unable to update subscription plan');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header user={user} onLogout={logout} />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
            Administration
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            Users and subscription plans
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Assign a plan after confirming the user’s payment. New accounts start on Free.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <p className="px-6 py-10 text-center text-sm text-slate-500">Loading users…</p>
          ) : users.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-slate-500">No users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">User</th>
                    <th className="px-5 py-3 font-semibold">Role</th>
                    <th className="px-5 py-3 font-semibold">Plan</th>
                    <th className="px-5 py-3 font-semibold">Plan limits</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((item) => (
                    <tr key={item.id}>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">{item.username}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{item.email}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{item.role || 'Viewer'}                      </td>
                      <td className="px-5 py-4">
                        <select
                          id={`plan-${item.id}`}
                          aria-label={`Subscription plan for ${item.username}`}
                          value={item.subscription_plan}
                          disabled={updatingId === item.id}
                          onChange={(event) => handlePlanChange(item.id, event.target.value)}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:opacity-60"
                        >
                          {planOptions.map((plan) => (
                            <option key={plan.value} value={plan.value}>
                              {plan.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {item.subscription_plan === 'premium'
                          ? 'Unlimited per month'
                          : item.subscription_plan === 'basic'
                            ? '50 finalized per month'
                            : '10 finalized per month'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminUsers;
