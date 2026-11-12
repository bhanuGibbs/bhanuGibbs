import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import { useAuth } from '../context/useAuth';
import { createCustomer, deleteCustomer, getCustomers, updateCustomer } from '../integration/backend/api';
import { digitsOnly, nameOnly, NAME_REGEX, EMAIL_REGEX, preventPaste } from '../utils/numericInput';

const emptyCustomer = {
  name: '',
  email: '',
  phone_number: '',
  address: '',
  company_name: '',
};

const Customers = () => {
  const { logout, user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(emptyCustomer);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await getCustomers();
      setCustomers(data || []);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Unable to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const setField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleReset = () => {
    setForm(emptyCustomer);
    setEditingId(null);
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (editingId) {
        const updated = await updateCustomer(editingId, form);
        setCustomers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        toast.success('Customer updated successfully');
      } else {
        const created = await createCustomer(form);
        setCustomers((current) => [created, ...current]);
        toast.success('Customer created successfully');
      }
      handleReset();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to save customer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (customer) => {
    setForm({
      name: customer.name || '',
      email: customer.email || '',
      phone_number: customer.phone_number || '',
      address: customer.address || '',
      company_name: customer.company_name || '',
    });
    setEditingId(customer.id);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (customerId) => {
    const confirmed = window.confirm('Delete this customer? This cannot be undone.');
    if (!confirmed) return;

    try {
      await deleteCustomer(customerId);
      setCustomers((current) => current.filter((item) => item.id !== customerId));
      toast.success('Customer deleted successfully');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Unable to delete customer');
    }
  };

  return (
    <div className="customers-page min-h-screen bg-[#F8F9FA] text-[#2D3748]">
      <style>{`
        .customers-page ::selection { background: #fed7aa; color: #9a3412; }
        .customers-page ::-moz-selection { background: #fed7aa; color: #9a3412; }
        .customers-page ::-webkit-scrollbar { width: 8px; height: 8px; }
        .customers-page ::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
        .customers-page ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .customers-page ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
      <Header onLogout={logout} user={user} />
      <main className="customers-page mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[700px_minmax(0,1fr)]">
          <section className="rounded-lg border border-[#1E3A5F]/10 bg-white p-6 shadow-card-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold text-[#FF6B35]">Customer management</p>
                <h2 className="mt-2 text-lg font-semibold tracking-tight text-[#1E3A5F]">Customer list</h2>
                <p className="mt-1 text-sm text-[#2D3748]/60">Manage customers for your company.</p>
              </div>
              <div className="text-sm text-[#2D3748]/60">
                {loading ? 'Loading…' : `${customers.length} customer${customers.length === 1 ? '' : 's'}`}
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-[#1E3A5F]/10 text-left text-sm">
                <thead className="bg-[#1E3A5F]/5 text-[#2D3748]/60">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 font-semibold">Company</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-[#1E3A5F]/5">
                {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-[#1E3A5F]/[0.03]">
                      <td className="px-4 py-3">{customer.name}</td>
                      <td className="px-4 py-3">{customer.email || '—'}</td>
                      <td className="px-4 py-3">{customer.phone_number || '—'}</td>
                      <td className="px-4 py-3">{customer.company_name || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                              type="button"
                              onClick={() => handleEdit(customer)}
                              className="rounded-lg border border-[#1E3A5F]/10 bg-white px-3 py-2 text-xs font-semibold text-[#1E3A5F] transition hover:border-[#FF6B35]/30 hover:text-[#FF6B35]"
                          >
                            Edit
                          </button>
                          <button
                              type="button"
                              onClick={() => handleDelete(customer.id)}
                              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                ))}
                {!loading && customers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-sm text-[#2D3748]/60">
                        No customers found. Add one to get started.
                      </td>
                    </tr>
                ) : null}
                </tbody>
              </table>
            </div>
          </section>
          <section className="rounded-lg border border-[#1E3A5F]/10 bg-white p-6 shadow-card-sm">
            <h2 className="text-lg font-semibold tracking-tight text-[#1E3A5F]">{editingId ? 'Update Customer' : 'New Customer'}</h2>
            <p className="mt-1 text-sm text-[#2D3748]/60">Enter the information for this customer.</p>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block text-sm font-medium text-[#1E3A5F]">
                Customer name
                <input
                  className="mt-2 w-full rounded-lg border border-[#2D3748]/20 bg-white px-4 py-3 text-sm text-[#1E3A5F] outline-none transition focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/25"
                  value={form.name}
                  onChange={(event) => setField('name', nameOnly(event.target.value))}
                  placeholder="Customer name"
                  pattern={NAME_REGEX.source}
                  title="Please enter only alphabetic characters"
                  required
                />
              </label>

              <label className="block text-sm font-medium text-[#1E3A5F]">
                Email address
                <input
                  type="email"
                  className="mt-2 w-full rounded-lg border border-[#2D3748]/20 bg-white px-4 py-3 text-sm text-[#1E3A5F] outline-none transition focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/25"
                  value={form.email}
                  onChange={(event) => setField('email', event.target.value)}
                  placeholder="customer@example.com"
                  pattern={EMAIL_REGEX.source}
                  title="Please enter a valid email address"
                />
              </label>

              <label className="block text-sm font-medium text-[#1E3A5F]">
                Phone number
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  pattern="[0-9]{10}"
                  title="Please provide valid data: enter a 10-digit mobile number."
                  className="mt-2 w-full rounded-lg border border-[#2D3748]/20 bg-white px-4 py-3 text-sm text-[#1E3A5F] outline-none transition focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/25"
                  value={form.phone_number}
                  onChange={(event) => setField('phone_number', digitsOnly(event.target.value, 10))}
                  onPaste={preventPaste}
                  placeholder="9876543210"
                />
              </label>

              <label className="block text-sm font-medium text-[#1E3A5F]">
                Company name
                <input
                  className="mt-2 w-full rounded-lg border border-[#2D3748]/20 bg-white px-4 py-3 text-sm text-[#1E3A5F] outline-none transition focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/25"
                  value={form.company_name}
                  onChange={(event) => setField('company_name', nameOnly(event.target.value))}
                  placeholder="Company name"
                  pattern={NAME_REGEX.source}
                  title="Please enter only alphabetic characters"
                />
              </label>

              <label className="block text-sm font-medium text-[#1E3A5F]">
                Address
                <textarea
                  rows="3"
                  className="mt-2 w-full rounded-lg border border-[#2D3748]/20 bg-white px-4 py-3 text-sm text-[#1E3A5F] outline-none transition focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/25"
                  value={form.address}
                  onChange={(event) => setField('address', event.target.value)}
                  placeholder="Customer address"
                />
              </label>

              {error ? <p className="text-sm text-rose-600">{error}</p> : null}

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center rounded-lg bg-[#FF6B35] px-4 py-3 text-sm font-semibold text-white shadow-cta transition hover:bg-[#e55a28] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {editingId ? 'Save changes' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center justify-center rounded-lg border border-[#1E3A5F]/10 bg-[#1E3A5F]/5 px-4 py-3 text-sm font-semibold text-[#1E3A5F] transition hover:border-[#FF6B35]/30 hover:text-[#FF6B35]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>

        </div>
      </main>
    </div>
  );
};

export default Customers;
