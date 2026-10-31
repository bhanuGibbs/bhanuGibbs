import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import { useAuth } from '../context/useAuth';
import { createProduct, deleteProduct, getProducts, updateProduct } from '../integration/backend/api';
import { decimalOnly, percentOnly, HSN_CODE_REGEX, preventPaste } from '../utils/numericInput';

const emptyProduct = {
  name: '',
  description: '',
  price: '',
  sku: '',
  gst_percentage: '',
  unit: '',
  hsn_code: '',
};

const Products = () => {
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
      const data = await getProducts();
      setProducts(data || []);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Unable to load products');
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
    const price = Number(form.price);
    if (!Number.isFinite(price) || price <= 0) {
      setError('Please provide a valid product price greater than zero.');
      return;
    }
    setSubmitting(true);

    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        price,
        sku: form.sku || null,
        gst_percentage: form.gst_percentage === '' ? null : Number(form.gst_percentage),
        unit: form.unit || null,
        hsn_code: form.hsn_code || null,
      };

      if (editingId) {
        const updated = await updateProduct(editingId, payload);
        setProducts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        toast.success('Product updated successfully');
      } else {
        const created = await createProduct(payload);
        setProducts((current) => [created, ...current]);
        toast.success('Product created successfully');
      }
      handleReset();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (product) => {
    setForm({
      name: product.name || '',
      description: product.description || '',
      price: product.price?.toString() || '',
      sku: product.sku || '',
      gst_percentage: product.gst_percentage?.toString() || '',
      unit: product.unit || '',
      hsn_code: product.hsn_code || '',
    });
    setEditingId(product.id);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (productId) => {
    const confirmed = window.confirm('Delete this product? This cannot be undone.');
    if (!confirmed) return;

    try {
      await deleteProduct(productId);
      setProducts((current) => current.filter((item) => item.id !== productId));
      toast.success('Product deleted successfully');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Unable to delete product');
    }
  };

  return (
    <div className="products-page min-h-screen bg-[#f7f8fa] text-slate-900">
      <style>{`
        .products-page ::selection { background: #d1fae5; color: #065f46; }
        .products-page ::-moz-selection { background: #d1fae5; color: #065f46; }
        .products-page ::-webkit-scrollbar { width: 8px; height: 8px; }
        .products-page ::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
        .products-page ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .products-page ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
      <Header onLogout={logout} user={user} />
      <main className="products-page mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[700px_minmax(0,1fr)]">
          <section className="rounded-2xl border border-slate-200/60 bg-white p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Product management</p>
                <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-900">Product catalog</h2>
                <p className="mt-1 text-sm text-slate-500">Products available for quotations.</p>
              </div>
              <div className="text-sm text-slate-500">
                {loading ? 'Loading…' : `${products.length} product${products.length === 1 ? '' : 's'}`}
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Price</th>
                  <th className="px-4 py-3 font-semibold">SKU</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                {products.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">{product.name}</td>
                      <td className="px-4 py-3">₹{Number(product.price).toFixed(2)}</td>
                      <td className="px-4 py-3">{product.sku || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                              type="button"
                              onClick={() => handleEdit(product)}
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700"
                          >
                            Edit
                          </button>
                          <button
                              type="button"
                              onClick={() => handleDelete(product.id)}
                              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                ))}
                {!loading && products.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-sm text-slate-500">
                        No products found. Add one to get started.
                      </td>
                    </tr>
                ) : null}
                </tbody>
              </table>
            </div>
          </section>
          <section className="rounded-2xl border border-slate-200/60 bg-white p-6">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">{editingId ? 'Update Product' : 'New Product'}</h2>
            <p className="mt-1 text-sm text-slate-500">Manage the product catalog for your company.</p>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block text-sm font-medium text-slate-700">
                Product name
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
                  value={form.name}
                  onChange={(event) => setField('name', event.target.value)}
                  placeholder="Product name"
                  required
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Price
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
                  value={form.price}
                  onChange={(event) => setField('price', decimalOnly(event.target.value, 12))}
                  placeholder="0.00"
                  required
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                SKU
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
                  value={form.sku}
                  onChange={(event) => setField('sku', event.target.value)}
                  placeholder="SKU code"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Description
                <textarea
                  rows="3"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
                  value={form.description}
                  onChange={(event) => setField('description', event.target.value)}
                  placeholder="Product description"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-medium text-slate-700">
                  Tax / GST %
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    inputMode="decimal"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
                    value={form.gst_percentage}
                    onChange={(event) => setField('gst_percentage', percentOnly(event.target.value))}
                    placeholder="18"
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Unit
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
                    value={form.unit}
                    onChange={(event) => setField('unit', event.target.value)}
                    placeholder="Each, kg, hour…"
                  />
                </label>
              </div>

              <label className="block text-sm font-medium text-slate-700">
                HSN/SAC code
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
                  value={form.hsn_code}
                  onChange={(event) => setField('hsn_code', event.target.value.replace(/[^0-9]/g, '').slice(0, 8))}
                  placeholder="HSN/SAC code (4-8 digits)"
                  maxLength={8}
                  pattern={HSN_CODE_REGEX.source}
                  title="Enter a valid HSN/SAC code (4-8 digits)"
                  inputMode="numeric"
                  onPaste={preventPaste}
                />
              </label>

              {error ? <p className="text-sm text-rose-600">{error}</p> : null}

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {editingId ? 'Save changes' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700"
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

export default Products;
