import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { createCustomer, deleteCustomer, getCustomers, updateCustomer } from '../integration/backend/api';

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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header onLogout={logout} user={user} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Customers</h1>
              <p className="mt-2 text-sm text-slate-500">Create, edit, and manage company customers in one place.</p>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-500 hover:text-brand-600"
            >
              Clear form
            </button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[400px_minmax(0,1fr)]">
          <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft">
            <h2 className="text-lg font-semibold text-slate-900">{editingId ? 'Update Customer' : 'New Customer'}</h2>
            <p className="mt-2 text-sm text-slate-500">Enter the information for this customer.</p>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block text-sm font-medium text-slate-700">
                Customer name
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white"
                  value={form.name}
                  onChange={(event) => setField('name', event.target.value)}
                  placeholder="Customer name"
                  required
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Email address
                <input
                  type="email"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white"
                  value={form.email}
                  onChange={(event) => setField('email', event.target.value)}
                  placeholder="customer@example.com"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Phone number
                <input
                  type="tel"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white"
                  value={form.phone_number}
                  onChange={(event) => setField('phone_number', event.target.value)}
                  placeholder="+91 98765 43210"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Company name
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white"
                  value={form.company_name}
                  onChange={(event) => setField('company_name', event.target.value)}
                  placeholder="Company name"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Address
                <textarea
                  rows="3"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white"
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
                  className="inline-flex items-center justify-center rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {editingId ? 'Save changes' : 'Create customer'}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-500 hover:text-brand-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Customer list</h2>
                <p className="mt-2 text-sm text-slate-500">Manage customers for your company.</p>
              </div>
              <div className="text-sm text-slate-500">
                {loading ? 'Loading…' : `${customers.length} customer${customers.length === 1 ? '' : 's'}`}
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Phone</th>
                    <th className="px-4 py-3 font-semibold">Company</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">{customer.name}</td>
                      <td className="px-4 py-3">{customer.email || '—'}</td>
                      <td className="px-4 py-3">{customer.phone_number || '—'}</td>
                      <td className="px-4 py-3">{customer.company_name || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(customer)}
                            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-brand-500 hover:text-brand-600"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(customer.id)}
                            className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!loading && customers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-sm text-slate-500">
                        No customers found. Add one to get started.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Customers;
