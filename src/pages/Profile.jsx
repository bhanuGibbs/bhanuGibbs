import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import { useAuth } from '../context/useAuth';
import { updateCurrentUser, changePassword } from '../integration/backend/auth';
import { salesInventoryApi } from '../integration/backend/salesInventory';
import { getPOSCashierStats, getPOSCashierPerformance } from '../integration/backend/posApi';
import { digitsOnly, preventPaste } from '../utils/numericInput';

const money = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
}).format(Number(value || 0));

const Profile = () => {
  const { user, logout, refreshUser } = useAuth();
  const [form, setForm] = useState({ username: '', email: '', mobile_number: '' });
  const [saving, setSaving] = useState(false);
  const [repStats, setRepStats] = useState(null);
  const [cashierStats, setCashierStats] = useState(null);
  const [adminRepPerformance, setAdminRepPerformance] = useState(null);
  const [adminCashierPerformance, setAdminCashierPerformance] = useState(null);
  const [notifPrefs, setNotifPrefs] = useState({ email: true, inApp: true, orderStatus: true, lowStock: true });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const isPOS = user?.business_profile === 'pos';
  const isSales = user?.role === 'Sales';
  const isAdmin = user?.role === 'Admin' || user?.role === 'Super Admin';
  const isSalesInventory = user?.business_profile === 'sales_inventory';

  useEffect(() => {
    setForm({
      username: user?.username || '',
      email: user?.email || '',
      mobile_number: user?.mobile_number || '',
    });
  }, [user]);

  // Load notification preferences
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('notif_prefs');
      if (stored) {
        try { setNotifPrefs(JSON.parse(stored)); } catch { /* ignore */ }
      }
    }
  }, []);

  // Load rep stats for sales reps
  useEffect(() => {
    if (isSales && isSalesInventory) {
      salesInventoryApi.repStats().then(setRepStats).catch(() => {});
    }
  }, [isSales, isSalesInventory]);

  // Load cashier stats for POS users
  useEffect(() => {
    if (isPOS) {
      getPOSCashierStats().then(setCashierStats).catch(() => {});
    }
  }, [isPOS]);

  // Load rep performance for Admin in sales_inventory profile
  useEffect(() => {
    if (isAdmin && isSalesInventory) {
      salesInventoryApi.repPerformanceReport().then(setAdminRepPerformance).catch(() => {});
    }
  }, [isAdmin, isSalesInventory]);

  // Load cashier performance for Admin in POS profile
  useEffect(() => {
    if (isAdmin && isPOS) {
      getPOSCashierPerformance().then(setAdminCashierPerformance).catch(() => {});
    }
  }, [isAdmin, isPOS]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await updateCurrentUser({
        username: form.username.trim(),
        email: form.email.trim(),
        mobile_number: form.mobile_number.trim() || null,
      });
      await refreshUser();
      toast.success('Your profile was updated.');
    } catch (error) {
      toast.error(error.message || 'Unable to update your profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleNotifPrefChange = (key) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('notif_prefs', JSON.stringify(updated));
    }
    toast.success('Notification preferences updated.');
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((current) => ({ ...current, [name]: value }));
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('New passwords do not match.');
      return;
    }
    setChangingPassword(true);
    try {
      await changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      setShowPasswordForm(false);
      toast.success('Your password was updated.');
    } catch (error) {
      toast.error(error.message || 'Unable to change password.');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="profile-page min-h-screen bg-[#F8F9FA]">
      <style>{`
        .profile-page ::selection { background: #ffedd5; color: #9a3412; }
        .profile-page ::-moz-selection { background: #ffedd5; color: #9a3412; }
        .profile-page ::-webkit-scrollbar { width: 8px; height: 8px; }
        .profile-page ::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
        .profile-page ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .profile-page ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
      <Header user={user} onLogout={logout} />
      <main className="profile-page mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-7">
          <p className="text-xs font-semibold text-[#FF6B35]">Account settings</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#1E3A5F]">My profile</h1>
          <p className="mt-1 text-sm text-[#2D3748]">Update your own account details. Your role and workspace access are managed separately.</p>
        </div>
        <form onSubmit={handleSubmit} className="rounded-xl border border-[#1E3A5F]/10 bg-white p-6 shadow-card-sm sm:p-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-medium text-[#1E3A5F]">
              Username
              <input
                required
                minLength={3}
                maxLength={100}
                name="username"
                value={form.username}
                onChange={handleChange}
                className="mt-2 w-full rounded-lg border border-[#1E3A5F]/10 px-3 py-2.5 text-sm outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100"
              />
            </label>
            <label className="block text-sm font-medium text-[#1E3A5F]">
              Email
              <input
                required
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="mt-2 w-full rounded-lg border border-[#1E3A5F]/10 px-3 py-2.5 text-sm outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100"
              />
            </label>
            <label className="block text-sm font-medium text-[#1E3A5F]">
              Mobile number
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                pattern="[0-9]{10}"
                title="Please provide valid data: enter a 10-digit mobile number."
                name="mobile_number"
                value={form.mobile_number}
                onChange={(event) => setForm((current) => ({ ...current, mobile_number: digitsOnly(event.target.value, 10) }))}
                onPaste={preventPaste}
                className="mt-2 w-full rounded-lg border border-[#1E3A5F]/10 px-3 py-2.5 text-sm outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100"
              />
            </label>
            <div className="rounded-lg bg-[#1E3A5F]/5 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-[#2D3748]">Role</p>
              <p className="mt-1 text-sm font-semibold text-[#1E3A5F]">{user?.role || 'Viewer'}</p>
              <p className="mt-1 text-xs text-[#2D3748]">Role changes are not available from profile settings.</p>
            </div>
            <div className="rounded-lg bg-orange-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-[#FF6B35]">Subscription plan</p>
              <p className="mt-1 text-sm font-semibold capitalize text-[#1E3A5F]">{user?.subscription_plan || 'free'}</p>
              <p className="mt-1 text-xs text-[#2D3748]">
                {user?.subscription_plan === 'premium'
                  ? isPOS
                    ? 'Unlimited POS transactions.'
                    : 'Unlimited finalized quotations and invoices.'
                  : user?.subscription_plan === 'basic'
                    ? isPOS
                      ? 'Up to 50 POS transactions per month.'
                      : 'Up to 50 finalized quotations and invoices per month.'
                    : isPOS
                      ? 'Up to 10 POS transactions per month.'
                      : 'Up to 10 finalized quotations and invoices per month.'}
              </p>
              <p className="mt-1 text-xs text-[#2D3748]">Plan changes are managed by an administrator.</p>
            </div>
          </div>
          <div className="mt-7 flex justify-end border-t border-[#1E3A5F]/5 pt-5">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#FF6B35] px-5 py-2.5 text-sm font-semibold text-white shadow-cta transition hover:bg-[#e55a28] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </form>

        {/* Sales Rep Stats — only for Sales role with sales_inventory profile */}
        {isSales && isSalesInventory && repStats && (
          <div className="mt-6 space-y-5">
            <div className="rounded-xl border border-[#FF6B35]/20 bg-gradient-to-r from-orange-50 to-white p-6 shadow-card-sm">
              <h2 className="font-semibold text-[#1E3A5F] mb-4">Your Sales Summary</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ['Orders submitted', repStats.submitted_count],
                  ['Orders approved', repStats.approved_count],
                  ['Conversion rate', `${repStats.conversion_rate}%`],
                  ['Approved sales', money(repStats.approved_sales_total)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-white p-4 shadow-sm border border-[#1E3A5F]/5">
                    <p className="text-xs font-medium text-[#2D3748]/60">{label}</p>
                    <p className="mt-1.5 text-xl font-semibold tracking-tight text-[#1E3A5F]">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Territory Info */}
            <div className="rounded-xl border border-[#1E3A5F]/10 bg-white p-6 shadow-card-sm">
              <h2 className="font-semibold text-[#1E3A5F] mb-3">Your Territories</h2>
              {repStats.territories.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {repStats.territories.map((t) => (
                    <span key={t} className="rounded-full bg-[#1E3A5F]/10 px-3 py-1.5 text-sm font-medium text-[#1E3A5F]">{t}</span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#2D3748]/60">No territories assigned yet. Territories appear when you create orders with dealers that have a territory set.</p>
              )}
            </div>

            {/* Top Dealers */}
            {repStats.top_dealers.length > 0 && (
              <div className="rounded-xl border border-[#1E3A5F]/10 bg-white p-6 shadow-card-sm">
                <h2 className="font-semibold text-[#1E3A5F] mb-3">Your Top Dealers</h2>
                <ul className="space-y-2">
                  {repStats.top_dealers.map((d) => (
                    <li key={d.dealer_id} className="flex items-center justify-between text-sm">
                      <span className="font-medium text-[#1E3A5F]">{d.dealer_name}</span>
                      <span className="text-[#2D3748]">{d.order_count} orders · {money(d.sales_total)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* POS Cashier Stats — only for POS users */}
        {isPOS && cashierStats && (
          <div className="mt-6 space-y-5">
            {/* Personal KPI Cards */}
            <div className="rounded-xl border border-[#FF6B35]/20 bg-gradient-to-r from-orange-50 to-white p-6 shadow-card-sm">
              <h2 className="font-semibold text-[#1E3A5F] mb-4">Your Cashier Performance</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ['Transactions completed', cashierStats.completed_count],
                  ['Revenue processed', money(cashierStats.completed_revenue)],
                  ['Avg transaction', money(cashierStats.avg_transaction_value)],
                  ['Today\'s transactions', `${cashierStats.today_count} (${money(cashierStats.today_revenue)})`],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-white p-4 shadow-sm border border-[#1E3A5F]/5">
                    <p className="text-xs font-medium text-[#2D3748]/60">{label}</p>
                    <p className="mt-1.5 text-xl font-semibold tracking-tight text-[#1E3A5F]">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Refund & Cancel Metrics */}
            <div className="rounded-xl border border-[#1E3A5F]/10 bg-white p-6 shadow-card-sm">
              <h2 className="font-semibold text-[#1E3A5F] mb-4">Accuracy Metrics</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ['Cancelled transactions', `${cashierStats.cancelled_count} (${cashierStats.cancel_rate}%)`],
                  ['Returns processed', `${cashierStats.return_count} (${cashierStats.return_rate}%)`],
                  ['Total refunds', money(cashierStats.total_refund_amount)],
                  ['Total transactions', cashierStats.total_count],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-[#1E3A5F]/5 p-4">
                    <p className="text-xs font-medium text-[#2D3748]/60">{label}</p>
                    <p className="mt-1.5 text-xl font-semibold tracking-tight text-[#1E3A5F]">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Breakdown & Top Products */}
            <div className="grid gap-5 lg:grid-cols-2">
              {cashierStats.payment_breakdown.length > 0 && (
                <div className="rounded-xl border border-[#1E3A5F]/10 bg-white p-6 shadow-card-sm">
                  <h2 className="font-semibold text-[#1E3A5F] mb-3">Payment Methods</h2>
                  <ul className="space-y-2">
                    {cashierStats.payment_breakdown.map((p) => (
                      <li key={p.method} className="flex items-center justify-between text-sm">
                        <span className="font-medium text-[#1E3A5F] capitalize">{p.method.replace('_', ' ')}</span>
                        <span className="text-[#2D3748]">{p.count} txns · {money(p.total)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {cashierStats.top_products.length > 0 && (
                <div className="rounded-xl border border-[#1E3A5F]/10 bg-white p-6 shadow-card-sm">
                  <h2 className="font-semibold text-[#1E3A5F] mb-3">Top Products Sold</h2>
                  <ul className="space-y-2">
                    {cashierStats.top_products.map((p) => (
                      <li key={p.product_id} className="flex items-center justify-between text-sm">
                        <span className="font-medium text-[#1E3A5F]">{p.product_name}</span>
                        <span className="text-[#2D3748]">{p.total_quantity} units · {money(p.total_value)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Admin View — POS Cashier Team Performance Summary */}
        {isAdmin && isPOS && adminCashierPerformance && (
          <div className="mt-6 space-y-5">
            <div className="rounded-xl border border-[#1E3A5F]/10 bg-white p-6 shadow-card-sm">
              <h2 className="font-semibold text-[#1E3A5F] mb-4">Cashier Team Performance</h2>
              {adminCashierPerformance.length > 0 ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-5">
                    {(() => {
                      const totalCashiers = adminCashierPerformance.length;
                      const totalCompleted = adminCashierPerformance.reduce((sum, c) => sum + (c.completed_count || 0), 0);
                      const totalRevenue = adminCashierPerformance.reduce((sum, c) => sum + Number(c.completed_revenue || 0), 0);
                      const avgCancelRate = totalCashiers
                        ? (adminCashierPerformance.reduce((sum, c) => sum + (c.cancel_rate || 0), 0) / totalCashiers).toFixed(1)
                        : 0;
                      return [
                        ['Total cashiers', totalCashiers],
                        ['Completed transactions', totalCompleted],
                        ['Total revenue', money(totalRevenue)],
                        ['Avg cancel rate', `${avgCancelRate}%`],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-lg bg-[#1E3A5F]/5 p-4">
                          <p className="text-xs font-medium text-[#2D3748]/60">{label}</p>
                          <p className="mt-1.5 text-xl font-semibold tracking-tight text-[#1E3A5F]">{value}</p>
                        </div>
                      ));
                    })()}
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-[#1E3A5F]/10">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#1E3A5F]/5 text-xs uppercase tracking-wide text-[#1E3A5F]/60">
                        <tr>
                          <th className="px-4 py-3">Cashier</th>
                          <th className="px-4 py-3">Completed</th>
                          <th className="px-4 py-3">Revenue</th>
                          <th className="px-4 py-3">Avg value</th>
                          <th className="px-4 py-3">Cancel rate</th>
                          <th className="px-4 py-3">Return rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1E3A5F]/5">
                        {adminCashierPerformance.map((cashier) => (
                          <tr key={cashier.cashier_id} className="hover:bg-[#1E3A5F]/2">
                            <td className="px-4 py-3">
                              <p className="font-medium text-[#1E3A5F]">{cashier.cashier_name}</p>
                            </td>
                            <td className="px-4 py-3 text-[#2D3748]">{cashier.completed_count ?? '—'}</td>
                            <td className="px-4 py-3 font-semibold text-[#1E3A5F]">{money(cashier.completed_revenue)}</td>
                            <td className="px-4 py-3 text-[#2D3748]">{money(cashier.avg_transaction_value)}</td>
                            <td className="px-4 py-3">
                              <span className={`text-sm font-semibold ${
                                (cashier.cancel_rate || 0) <= 5 ? 'text-green-700' :
                                (cashier.cancel_rate || 0) <= 15 ? 'text-amber-700' : 'text-rose-700'
                              }`}>
                                {cashier.cancel_rate ?? 0}%
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-sm font-semibold ${
                                (cashier.return_rate || 0) <= 3 ? 'text-green-700' :
                                (cashier.return_rate || 0) <= 10 ? 'text-amber-700' : 'text-rose-700'
                              }`}>
                                {cashier.return_rate ?? 0}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p className="text-sm text-[#2D3748]/60">No cashier data available yet. Performance appears once transactions are processed.</p>
              )}
            </div>
          </div>
        )}

        {/* Admin View — Sales Team Performance Summary */}
        {isAdmin && isSalesInventory && adminRepPerformance && (
          <div className="mt-6 space-y-5">
            <div className="rounded-xl border border-[#1E3A5F]/10 bg-white p-6 shadow-card-sm">
              <h2 className="font-semibold text-[#1E3A5F] mb-4">Sales Team Performance</h2>
              {adminRepPerformance.length > 0 ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-5">
                    {(() => {
                      const totalOrders = adminRepPerformance.reduce((sum, r) => sum + (r.order_count || 0), 0);
                      const totalSales = adminRepPerformance.reduce((sum, r) => sum + Number(r.sales_total || 0), 0);
                      const avgConversion = adminRepPerformance.length
                        ? (adminRepPerformance.reduce((sum, r) => sum + (r.conversion_rate || 0), 0) / adminRepPerformance.length).toFixed(1)
                        : 0;
                      const topRep = adminRepPerformance.reduce((top, r) =>
                        Number(r.sales_total || 0) > Number(top?.sales_total || 0) ? r : top
                      , null);
                      return [
                        ['Total reps', adminRepPerformance.length],
                        ['Approved orders', totalOrders],
                        ['Total sales', money(totalSales)],
                        ['Avg conversion', `${avgConversion}%`],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-lg bg-[#1E3A5F]/5 p-4">
                          <p className="text-xs font-medium text-[#2D3748]/60">{label}</p>
                          <p className="mt-1.5 text-xl font-semibold tracking-tight text-[#1E3A5F]">{value}</p>
                        </div>
                      ));
                    })()}
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-[#1E3A5F]/10">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#1E3A5F]/5 text-xs uppercase tracking-wide text-[#1E3A5F]/60">
                        <tr>
                          <th className="px-4 py-3">Sales rep</th>
                          <th className="px-4 py-3">Orders</th>
                          <th className="px-4 py-3">Sales value</th>
                          <th className="px-4 py-3">Conversion</th>
                          <th className="px-4 py-3">Rejected</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1E3A5F]/5">
                        {adminRepPerformance.map((rep) => (
                          <tr key={rep.sales_rep_id} className="hover:bg-[#1E3A5F]/2">
                            <td className="px-4 py-3">
                              <p className="font-medium text-[#1E3A5F]">{rep.sales_rep_name}</p>
                            </td>
                            <td className="px-4 py-3 text-[#2D3748]">{rep.order_count ?? '—'}</td>
                            <td className="px-4 py-3 font-semibold text-[#1E3A5F]">{money(rep.sales_total)}</td>
                            <td className="px-4 py-3">
                              <span className={`text-sm font-semibold ${
                                (rep.conversion_rate || 0) >= 70 ? 'text-green-700' :
                                (rep.conversion_rate || 0) >= 40 ? 'text-amber-700' : 'text-rose-700'
                              }`}>
                                {rep.conversion_rate ?? 0}%
                              </span>
                            </td>
                            <td className="px-4 py-3 text-[#2D3748]">{rep.rejected_count ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p className="text-sm text-[#2D3748]/60">No sales representative data available yet. Performance appears once orders are submitted and approved.</p>
              )}
            </div>
          </div>
        )}

        {/* Notification Preferences — for all roles */}
        <div className="mt-6 rounded-xl border border-[#1E3A5F]/10 bg-white p-6 shadow-card-sm">
          <h2 className="font-semibold text-[#1E3A5F] mb-1">Notification Preferences</h2>
          <p className="text-sm text-[#2D3748]/60 mb-4">Control which notifications you receive. These settings are saved locally on your device.</p>
          <div className="space-y-3">
            {[
              ['inApp', 'In-app notifications', 'Show notifications inside the dashboard'],
              ['email', 'Email notifications', 'Receive notification emails'],
              ...(isSales ? [['orderStatus', 'Order status changes', 'Get notified when orders are approved or rejected']] : []),
              ...(isAdmin ? [['orderStatus', 'New order submissions', 'Get notified when reps submit new orders']] : []),
              ...(isPOS ? [['lowStock', 'Low stock during checkout', 'Alert when scanning an out-of-stock item']] : []),
              ...(isPOS ? [['paymentFailure', 'Payment failures', 'Get notified when a payment is declined']] : []),
              ...(!isPOS && !isSales && !isAdmin ? [['lowStock', 'Low stock alerts', 'Get notified when products fall below reorder level']] : []),
              ...(!isPOS && !isSales && !isAdmin ? [['lowStockGeneral', 'Inventory alerts', 'General inventory notifications']] : []),
            ].map(([key, label, description]) => (
              <label key={key} className="flex items-center justify-between rounded-lg bg-[#1E3A5F]/5 p-3">
                <div>
                  <p className="text-sm font-medium text-[#1E3A5F]">{label}</p>
                  <p className="text-xs text-[#2D3748]/60">{description}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={notifPrefs[key]}
                  onClick={() => handleNotifPrefChange(key)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-100 ${notifPrefs[key] ? 'bg-[#FF6B35]' : 'bg-[#1E3A5F]/20'}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${notifPrefs[key] ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </button>
              </label>
            ))}
          </div>
        </div>

        {/* Password Change — for all roles */}
        <div className="mt-6 rounded-xl border border-[#1E3A5F]/10 bg-white p-6 shadow-card-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-[#1E3A5F] mb-1">Security</h2>
              <p className="text-sm text-[#2D3748]/60">Manage your account password.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="rounded-lg border border-[#1E3A5F]/10 px-4 py-2 text-sm font-medium text-[#1E3A5F] transition hover:bg-[#1E3A5F]/5"
            >
              {showPasswordForm ? 'Cancel' : 'Change password'}
            </button>
          </div>
          {showPasswordForm && (
            <form onSubmit={handlePasswordSubmit} className="mt-5 space-y-4">
              <label className="block text-sm font-medium text-[#1E3A5F]">
                Current password
                <input
                  required
                  type="password"
                  name="current_password"
                  value={passwordForm.current_password}
                  onChange={handlePasswordChange}
                  className="mt-2 w-full rounded-lg border border-[#1E3A5F]/10 px-3 py-2.5 text-sm outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100"
                />
              </label>
              <label className="block text-sm font-medium text-[#1E3A5F]">
                New password
                <input
                  required
                  type="password"
                  name="new_password"
                  value={passwordForm.new_password}
                  onChange={handlePasswordChange}
                  minLength={8}
                  className="mt-2 w-full rounded-lg border border-[#1E3A5F]/10 px-3 py-2.5 text-sm outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100"
                />
                <p className="mt-1 text-xs text-[#2D3748]/60">Minimum 8 characters.</p>
              </label>
              <label className="block text-sm font-medium text-[#1E3A5F]">
                Confirm new password
                <input
                  required
                  type="password"
                  name="confirm_password"
                  value={passwordForm.confirm_password}
                  onChange={handlePasswordChange}
                  minLength={8}
                  className="mt-2 w-full rounded-lg border border-[#1E3A5F]/10 px-3 py-2.5 text-sm outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100"
                />
              </label>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="rounded-lg bg-[#FF6B35] px-5 py-2.5 text-sm font-semibold text-white shadow-cta transition hover:bg-[#e55a28] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {changingPassword ? 'Updating…' : 'Update password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};

export default Profile;
