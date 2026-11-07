import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, X } from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../context/useAuth';
import { getAdminUsers, getAllCompanies, updateUserPlan, updateUserRole, deleteUser, createUser } from '../integration/backend/api';

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
  const [selectedBusinessProfile, setSelectedBusinessProfile] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load companies for Super Admin
        if (isSuperAdmin(user)) {
          try {
            const allCompanies = await getAllCompanies();
            setCompanies(allCompanies);
          } catch (error) {
            console.error('Failed to load companies for Super Admin filter:', error);
            toast.error(error.message || 'Unable to load companies');
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

  const loadUsers = async (companyId, businessProfile) => {
    setLoading(true);
    try {
      setUsers(await getAdminUsers(companyId || undefined, businessProfile || undefined));
    } catch (error) {
      toast.error(error.message || 'Unable to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyChange = (companyId) => {
    setSelectedCompany(companyId);
    loadUsers(companyId || null, selectedBusinessProfile || null);
  };

  const handleBusinessProfileChange = (businessProfile) => {
    setSelectedBusinessProfile(businessProfile);
    loadUsers(selectedCompany || null, businessProfile || null);
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

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUsername.trim() || !newEmail.trim() || !newPassword.trim()) {
      toast.error('All fields are required.');
      return;
    }
    setCreating(true);
    try {
      const newUser = await createUser(newUsername.trim(), newEmail.trim(), newPassword);
      setUsers((current) => [...current, newUser]);
      setNewUsername('');
      setNewEmail('');
      setNewPassword('');
      setShowAddForm(false);
      toast.success('User created and added to your company.');
    } catch (error) {
      toast.error(error.message || 'Unable to create user');
    } finally {
      setCreating(false);
    }
  };

  const resetAddForm = () => {
    setNewUsername('');
    setNewEmail('');
    setNewPassword('');
    setShowAddForm(false);
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

        {isSuperAdmin(user) && (
          <div className="mb-4 flex flex-wrap items-center gap-4">
            {companies.length > 0 && (
              <div className="flex items-center gap-3">
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
            <div className="flex items-center gap-3">
              <label htmlFor="business-profile-filter" className="text-sm font-medium text-slate-700">
                Filter by profile
              </label>
              <select
                id="business-profile-filter"
                value={selectedBusinessProfile}
                onChange={(e) => handleBusinessProfileChange(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="">All profiles</option>
                <option value="invoice">Quotations</option>
                <option value="pos">POS</option>
                <option value="delivery_challan">Delivery Challan</option>
              </select>
            </div>
          </div>
        )}

        {/* Add Team Member Button */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {users.length} user{users.length !== 1 ? 's' : ''} in
            {user?.company_name ? ` ${user.company_name}` : ' your company'}
          </p>
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            {showAddForm ? <X size={16} /> : <Plus size={16} />}
            {showAddForm ? 'Cancel' : 'Add Team Member'}
          </button>
        </div>

        {/* Add Team Member Form */}
        {showAddForm && (
          <form
            onSubmit={handleCreateUser}
            className="mb-4 rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm"
          >
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Add Team Member</h3>
            <p className="mb-4 text-sm text-slate-500">
              New members will be added to your company with the Sales role. You can change their
              role after creating the account.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="new-username"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Username
                </label>
                <input
                  id="new-username"
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  placeholder="johndoe"
                />
              </div>
              <div>
                <label
                  htmlFor="new-email"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Email
                </label>
                <input
                  id="new-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  placeholder="john@company.com"
                />
              </div>
              <div>
                <label
                  htmlFor="new-password"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Password
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  placeholder="Min 8 characters"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={resetAddForm}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {creating ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
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
