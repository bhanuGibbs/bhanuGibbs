import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { createProduct, deleteProduct, getProducts, updateProduct } from '../integration/backend/api';

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
    setSubmitting(true);

    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        price: Number(form.price) || 0,
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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header onLogout={logout} user={user} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Products</h1>
              <p className="mt-2 text-sm text-slate-500">Create, update, and delete products available for quotations.</p>
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
            <h2 className="text-lg font-semibold text-slate-900">{editingId ? 'Update Product' : 'New Product'}</h2>
            <p className="mt-2 text-sm text-slate-500">Manage the product catalog for your company.</p>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block text-sm font-medium text-slate-700">
                Product name
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white"
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
                  min="0"
                  step="0.01"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white"
                  value={form.price}
                  onChange={(event) => setField('price', event.target.value)}
                  placeholder="0.00"
                  required
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                SKU
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white"
                  value={form.sku}
                  onChange={(event) => setField('sku', event.target.value)}
                  placeholder="SKU code"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Description
                <textarea
                  rows="3"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white"
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
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white"
                    value={form.gst_percentage}
                    onChange={(event) => setField('gst_percentage', event.target.value)}
                    placeholder="18"
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Unit
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white"
                    value={form.unit}
                    onChange={(event) => setField('unit', event.target.value)}
                    placeholder="Each, kg, hour…"
                  />
                </label>
              </div>

              <label className="block text-sm font-medium text-slate-700">
                HSN/SAC code
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white"
                  value={form.hsn_code}
                  onChange={(event) => setField('hsn_code', event.target.value)}
                  placeholder="HSN/SAC code"
                />
              </label>

              {error ? <p className="text-sm text-rose-600">{error}</p> : null}

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {editingId ? 'Save changes' : 'Create product'}
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
                <h2 className="text-lg font-semibold text-slate-900">Product catalog</h2>
                <p className="mt-2 text-sm text-slate-500">Products available for quotations.</p>
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
                            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-brand-500 hover:text-brand-600"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(product.id)}
                            className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
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
        </div>
      </main>
    </div>
  );
};

export default Products;
