import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../context/useAuth';
import { getAdminUsers, getAllCompanies, updateUserPlan, updateUserRole, deleteUser } from '../integration/backend/api';

const planOptions = [
  { value: 'free', label: 'Free — 10 per month' },
  { value: 'basic', label: 'Basic — 50 per month' },
  { value: 'premium', label: 'Premium — unlimited' },
];

const roleOptions = ['Sales', 'Admin'];
const isSuperAdmin = (u) => u?.role === 'Super Admin';

const AdminUsers = () => {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load companies for Super Admin
        if (isSuperAdmin(user)) {
          try {
            const allCompanies = await getAllCompanies();
            setCompanies(allCompanies);
          } catch (error) {
            // Silently fail — companies list is optional
          }
        }
        setUsers(await getAdminUsers());
      } catch (error) {
        toast.error(error.message || 'Unable to load users');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const loadUsersByCompany = async (companyId) => {
    setLoading(true);
    try {
      setUsers(await getAdminUsers(companyId || undefined));
    } catch (error) {
      toast.error(error.message || 'Unable to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyChange = (companyId) => {
    setSelectedCompany(companyId);
    loadUsersByCompany(companyId || null);
  };

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

  const handleRoleChange = async (userId, roleName) => {
    setUpdatingId(userId);
    try {
      const updatedUser = await updateUserRole(userId, roleName);
      setUsers((current) =>
        current.map((item) => (item.id === userId ? updatedUser : item)),
      );
      toast.success('Role updated.');
    } catch (error) {
      toast.error(error.message || 'Unable to update role');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (userId, username) => {
    if (!window.confirm(`Permanently delete user "${username}"? This cannot be undone.`)) {
      return;
    }
    setUpdatingId(userId);
    try {
      await deleteUser(userId);
      setUsers((current) => current.filter((item) => item.id !== userId));
      toast.success('User deleted.');
    } catch (error) {
      toast.error(error.message || 'Unable to delete user');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="admin-users-page min-h-screen bg-[#f7f8fa]">
      <style>{`
        .admin-users-page ::selection { background: #d1fae5; color: #065f46; }
        .admin-users-page ::-moz-selection { background: #d1fae5; color: #065f46; }
        .admin-users-page ::-webkit-scrollbar { width: 8px; height: 8px; }
        .admin-users-page ::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
        .admin-users-page ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .admin-users-page ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
      <Header user={user} onLogout={logout} />
      <main className="admin-users-page mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
            Administration
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            Users and subscription plans
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Assign a plan after confirming the user's payment. New accounts start on Free.
          </p>
        </div>

        {isSuperAdmin(user) && companies.length > 0 && (
          <div className="mb-4 flex items-center gap-3">
            <label htmlFor="company-filter" className="text-sm font-medium text-slate-700">
              Filter by company
            </label>
            <select
              id="company-filter"
              value={selectedCompany}
              onChange={(e) => handleCompanyChange(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="">All companies</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white">
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
                    {isSuperAdmin(user) && (
                      <>
                        <th className="px-5 py-3 font-semibold">Plan</th>
                        <th className="px-5 py-3 font-semibold">Plan limits</th>
                      </>
                    )}
                    <th className="px-5 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((item) => (
                    <tr key={item.id}>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">{item.username}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{item.email}</p>
                      </td>
                      <td className="px-5 py-4">
                        {item.role === 'Super Admin' ? (
                          <span className="inline-flex items-center rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                            Super Admin
                          </span>
                        ) : (
                          <select
                            id={`role-${item.id}`}
                            aria-label={`Role for ${item.username}`}
                            value={item.role || 'Sales'}
                            disabled={updatingId === item.id}
                            onChange={(event) => handleRoleChange(item.id, event.target.value)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:opacity-60"
                          >
                            {roleOptions.map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      {isSuperAdmin(user) && (
                        <>
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
                        </>
                      )}
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id, item.username)}
                          disabled={updatingId === item.id}
                          aria-label={`Delete ${item.username}`}
                          className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-xs font-semibold text-slate-500 transition hover:border-rose-200 hover:text-rose-700 disabled:opacity-60"
                        >
                          <Trash2 size={14} />
                          <span>Delete</span>
                        </button>
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
