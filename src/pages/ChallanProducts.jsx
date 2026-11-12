import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import { useAuth } from '../context/useAuth';
import { createChallanProduct, deleteChallanProduct, getChallanProducts, updateChallanProduct } from '../integration/backend/api';
import { decimalOnly, preventPaste } from '../utils/numericInput';

const emptyProduct = {
  crop: '',
  variety: '',
  seed_class: '',
  lot_no: '',
  unit_size: '',
  unit_per_sack_box: '',
  sack_box: '',
  value: '',
};

const ChallanProducts = () => {
  const { logout, user } = useAuth();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await getChallanProducts();
      setProducts(data || []);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Unable to load challan products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const setField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleReset = () => {
    setForm(emptyProduct);
    setEditingId(null);
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    const value = Number(form.value);
    if (!Number.isFinite(value) || value <= 0) {
      setError('Please provide a valid price per kg greater than zero.');
      return;
    }
    setSubmitting(true);

    try {
      const payload = {
        crop: form.crop,
        variety: form.variety || null,
        seed_class: form.seed_class || null,
        lot_no: form.lot_no || null,
        unit_size: form.unit_size || null,
        unit_per_sack_box: form.unit_per_sack_box === '' ? null : Number(form.unit_per_sack_box),
        sack_box: form.sack_box === '' ? null : Number(form.sack_box),
        value,
      };

      if (editingId) {
        const updated = await updateChallanProduct(editingId, payload);
        setProducts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        toast.success('Challan product updated successfully');
      } else {
        const created = await createChallanProduct(payload);
        setProducts((current) => [created, ...current]);
        toast.success('Challan product created successfully');
      }
      handleReset();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to save challan product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (product) => {
    setForm({
      crop: product.crop || '',
      variety: product.variety || '',
      seed_class: product.seed_class || '',
      lot_no: product.lot_no || '',
      unit_size: product.unit_size || '',
      unit_per_sack_box: product.unit_per_sack_box?.toString() || '',
      sack_box: product.sack_box?.toString() || '',
      value: product.value?.toString() || '',
    });
    setEditingId(product.id);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (productId) => {
    const confirmed = window.confirm('Delete this challan product? This cannot be undone.');
    if (!confirmed) return;

    try {
      await deleteChallanProduct(productId);
      setProducts((current) => current.filter((item) => item.id !== productId));
      toast.success('Challan product deleted successfully');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Unable to delete challan product');
    }
  };

  return (
    <div className="challan-products-page min-h-screen bg-[#F8F9FA] text-[#2D3748]">
      <style>{`
        .challan-products-page ::selection { background: #fed7aa; color: #9a3412; }
        .challan-products-page ::-moz-selection { background: #fed7aa; color: #9a3412; }
        .challan-products-page ::-webkit-scrollbar { width: 8px; height: 8px; }
        .challan-products-page ::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
        .challan-products-page ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .challan-products-page ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
      <Header onLogout={logout} user={user} />
      <main className="challan-products-page mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[700px_minmax(0,1fr)]">
          <section className="rounded-xl border border-[#1E3A5F]/10 bg-white p-6 shadow-card-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold text-[#FF6B35]">Challan product management</p>
                <h2 className="mt-2 text-lg font-semibold tracking-tight text-[#1E3A5F]">Challan product catalog</h2>
                <p className="mt-1 text-sm text-[#2D3748]/60">Agriculture-specific products for delivery challans.</p>
              </div>
              <div className="text-sm text-[#2D3748]/60">
                {loading ? 'Loading…' : `${products.length} product${products.length === 1 ? '' : 's'}`}
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-[#1E3A5F]/10 text-left text-sm">
                <thead className="bg-[#1E3A5F]/5 text-[#1E3A5F]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Crop</th>
                  <th className="px-4 py-3 font-semibold">Variety</th>
                  <th className="px-4 py-3 font-semibold">Lot No</th>
                  <th className="px-4 py-3 font-semibold">Value/kg</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-[#1E3A5F]/10">
                {products.map((product) => (
                    <tr key={product.id} className="hover:bg-[#1E3A5F]/5">
                      <td className="px-4 py-3 text-[#1E3A5F]">{product.crop}</td>
                      <td className="px-4 py-3 text-[#2D3748]">{product.variety || '—'}</td>
                      <td className="px-4 py-3 text-[#2D3748]">{product.lot_no || '—'}</td>
                      <td className="px-4 py-3 font-semibold text-[#1E3A5F]">₹{Number(product.value).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                              type="button"
                              onClick={() => handleEdit(product)}
                              className="rounded-lg border border-[#1E3A5F]/10 bg-white px-3 py-2 text-xs font-semibold text-[#1E3A5F] transition hover:border-[#FF6B35] hover:text-[#FF6B35]"
                          >
                            Edit
                          </button>
                          <button
                              type="button"
                              onClick={() => handleDelete(product.id)}
                              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                ))}
                {!loading && products.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-sm text-[#2D3748]/60">
                        No challan products found. Add one to get started.
                      </td>
                    </tr>
                ) : null}
                </tbody>
              </table>
            </div>
          </section>
          <section className="rounded-xl border border-[#1E3A5F]/10 bg-white p-6 shadow-card-sm">
            <h2 className="text-lg font-semibold tracking-tight text-[#1E3A5F]">{editingId ? 'Update Challan Product' : 'New Challan Product'}</h2>
            <p className="mt-1 text-sm text-[#2D3748]/60">Manage agriculture-specific products for delivery challans.</p>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block text-sm font-medium text-[#1E3A5F]">
                Crop <span className="text-rose-500">*</span>
                <input
                  className="mt-2 w-full rounded-lg border border-[#2D3748]/20 bg-[#1E3A5F]/5 px-4 py-3 text-sm text-[#1E3A5F] outline-none transition focus:border-[#FF6B35] focus:bg-white focus:ring-2 focus:ring-[#FF6B35]/25"
                  value={form.crop}
                  onChange={(event) => setField('crop', event.target.value)}
                  placeholder="e.g. Rice, Wheat, Paddy"
                  required
                />
              </label>

              <label className="block text-sm font-medium text-[#1E3A5F]">
                Variety
                <input
                  className="mt-2 w-full rounded-lg border border-[#2D3748]/20 bg-[#1E3A5F]/5 px-4 py-3 text-sm text-[#1E3A5F] outline-none transition focus:border-[#FF6B35] focus:bg-white focus:ring-2 focus:ring-[#FF6B35]/25"
                  value={form.variety}
                  onChange={(event) => setField('variety', event.target.value)}
                  placeholder="e.g. IR-64, Basmati"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-medium text-[#1E3A5F]">
                  Seed Class
                  <input
                    className="mt-2 w-full rounded-lg border border-[#2D3748]/20 bg-[#1E3A5F]/5 px-4 py-3 text-sm text-[#1E3A5F] outline-none transition focus:border-[#FF6B35] focus:bg-white focus:ring-2 focus:ring-[#FF6B35]/25"
                    value={form.seed_class}
                    onChange={(event) => setField('seed_class', event.target.value)}
                    placeholder="e.g. Foundation, Certified"
                  />
                </label>
                <label className="block text-sm font-medium text-[#1E3A5F]">
                  Lot No
                  <input
                    className="mt-2 w-full rounded-lg border border-[#2D3748]/20 bg-[#1E3A5F]/5 px-4 py-3 text-sm text-[#1E3A5F] outline-none transition focus:border-[#FF6B35] focus:bg-white focus:ring-2 focus:ring-[#FF6B35]/25"
                    value={form.lot_no}
                    onChange={(event) => setField('lot_no', event.target.value)}
                    placeholder="Batch number"
                  />
                </label>
              </div>

              <label className="block text-sm font-medium text-[#1E3A5F]">
                Unit Size
                <input
                  className="mt-2 w-full rounded-lg border border-[#2D3748]/20 bg-[#1E3A5F]/5 px-4 py-3 text-sm text-[#1E3A5F] outline-none transition focus:border-[#FF6B35] focus:bg-white focus:ring-2 focus:ring-[#FF6B35]/25"
                  value={form.unit_size}
                  onChange={(event) => setField('unit_size', event.target.value)}
                  placeholder="e.g. 1 Kg, 5 Kg"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-medium text-[#1E3A5F]">
                  Units per Sack/Box
                  <input
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    className="mt-2 w-full rounded-lg border border-[#2D3748]/20 bg-[#1E3A5F]/5 px-4 py-3 text-sm text-[#1E3A5F] outline-none transition focus:border-[#FF6B35] focus:bg-white focus:ring-2 focus:ring-[#FF6B35]/25"
                    value={form.unit_per_sack_box}
                    onChange={(event) => setField('unit_per_sack_box', event.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="e.g. 10"
                  />
                </label>
                <label className="block text-sm font-medium text-[#1E3A5F]">
                  Sacks/Boxes
                  <input
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    className="mt-2 w-full rounded-lg border border-[#2D3748]/20 bg-[#1E3A5F]/5 px-4 py-3 text-sm text-[#1E3A5F] outline-none transition focus:border-[#FF6B35] focus:bg-white focus:ring-2 focus:ring-[#FF6B35]/25"
                    value={form.sack_box}
                    onChange={(event) => setField('sack_box', event.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="e.g. 5"
                  />
                </label>
              </div>

              <label className="block text-sm font-medium text-[#1E3A5F]">
                Price per Kg <span className="text-rose-500">*</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  className="mt-2 w-full rounded-lg border border-[#2D3748]/20 bg-[#1E3A5F]/5 px-4 py-3 text-sm text-[#1E3A5F] outline-none transition focus:border-[#FF6B35] focus:bg-white focus:ring-2 focus:ring-[#FF6B35]/25"
                  value={form.value}
                  onChange={(event) => setField('value', decimalOnly(event.target.value, 12))}
                  placeholder="0.00"
                  required
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
                  className="inline-flex items-center justify-center rounded-lg border border-[#1E3A5F]/10 bg-[#1E3A5F]/5 px-4 py-3 text-sm font-semibold text-[#1E3A5F] transition hover:border-[#FF6B35] hover:text-[#FF6B35]"
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

export default ChallanProducts;
