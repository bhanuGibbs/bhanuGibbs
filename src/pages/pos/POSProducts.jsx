import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Package, Plus, Search, Trash2, X } from 'lucide-react';
import Header from '../../components/Header';
import toast from 'react-hot-toast';
import {
  createPOSProduct,
  createPOSCategory,
  deletePOSProduct,
  getPOSCategories,
  getPOSProducts,
} from '../../integration/backend/posApi';

const formatMoney = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(Number(value) || 0);

const POSProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', sku: '', barcode: '', selling_price: '', unit: 'Pcs',
    category_id: '', description: '', purchase_price: '0', stock_quantity: 0, low_stock_threshold: 5,
  });

  const loadData = useCallback(async () => {
    try {
      const [prods, cats] = await Promise.all([
        getPOSProducts(selectedCategory, search),
        getPOSCategories(),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, search]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        selling_price: Number(form.selling_price),
        purchase_price: Number(form.purchase_price) || 0,
        stock_quantity: Number(form.stock_quantity),
        low_stock_threshold: Number(form.low_stock_threshold),
        category_id: form.category_id || null,
      };
      await createPOSProduct(payload);
      toast.success('Product created');
      setShowForm(false);
      setForm({ name: '', sku: '', barcode: '', selling_price: '', unit: 'Pcs', category_id: '', description: '', purchase_price: '0', stock_quantity: 0, low_stock_threshold: 5 });
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to create product');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await deletePOSProduct(id);
      toast.success('Product deleted');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA]">
        <Header />
        <div className="flex items-center justify-center py-32"><p className="text-[#2D3748]/60">Loading products...</p></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[#1E3A5F]">POS Products</h1>
          <button onClick={() => setShowForm(true)} className="rounded-xl bg-[#FF6B35] px-4 py-2.5 text-sm font-semibold text-white shadow-cta hover:bg-[#e55a28] flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Product
          </button>
        </div>

        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#2D3748]/40" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="w-full rounded-xl border border-[#1E3A5F]/10 bg-white pl-10 pr-4 py-2.5 text-sm text-[#1E3A5F] outline-none focus:border-[#FF6B35]" />
          </div>
          <select value={selectedCategory || ''} onChange={(e) => setSelectedCategory(e.target.value || null)} className="rounded-xl border border-[#1E3A5F]/10 bg-white px-4 py-2.5 text-sm text-[#1E3A5F] outline-none focus:border-[#FF6B35]">
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="rounded-xl border border-[#1E3A5F]/10 bg-white overflow-hidden shadow-card-sm">
          <table className="w-full text-sm">
            <thead className="bg-[#1E3A5F]/5 border-b border-[#1E3A5F]/10">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-[#1E3A5F]">Name</th>
                <th className="text-left px-4 py-3 font-medium text-[#1E3A5F]">SKU</th>
                <th className="text-left px-4 py-3 font-medium text-[#1E3A5F]">Barcode</th>
                <th className="text-left px-4 py-3 font-medium text-[#1E3A5F]">Price</th>
                <th className="text-left px-4 py-3 font-medium text-[#1E3A5F]">Stock</th>
                <th className="text-left px-4 py-3 font-medium text-[#1E3A5F]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-[#1E3A5F]/5 last:border-0">
                  <td className="px-4 py-3 font-medium text-[#1E3A5F]">{p.name}</td>
                  <td className="px-4 py-3 text-[#2D3748]">{p.sku}</td>
                  <td className="px-4 py-3 text-[#2D3748]">{p.barcode}</td>
                  <td className="px-4 py-3 font-semibold text-[#FF6B35]">{formatMoney(p.selling_price)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${p.stock_quantity <= 0 ? 'bg-rose-100 text-rose-700' : p.stock_quantity <= p.low_stock_threshold ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                      {p.stock_quantity} {p.unit}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(p.id)} className="text-[#2D3748]/40 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-[#2D3748]/40">No products found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add Product Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-card-lg">
              <div className="flex items-center justify-between p-4 border-b border-[#1E3A5F]/10">
                <h2 className="font-semibold text-[#1E3A5F]">Add Product</h2>
                <button onClick={() => setShowForm(false)} className="text-[#2D3748]/40 hover:text-[#1E3A5F]"><X className="h-5 w-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-4 space-y-3">
                <input required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="Product name" className="w-full rounded-xl border border-[#1E3A5F]/10 px-4 py-2.5 text-sm text-[#1E3A5F] outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/25" />
                <div className="grid grid-cols-2 gap-3">
                  <input required value={form.sku} onChange={(e) => setForm({...form, sku: e.target.value})} placeholder="SKU" className="w-full rounded-xl border border-[#1E3A5F]/10 px-4 py-2.5 text-sm text-[#1E3A5F] outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/25" />
                  <input required value={form.barcode} onChange={(e) => setForm({...form, barcode: e.target.value})} placeholder="Barcode" className="w-full rounded-xl border border-[#1E3A5F]/10 px-4 py-2.5 text-sm text-[#1E3A5F] outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/25" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input required type="number" min="0" step="0.01" value={form.selling_price} onChange={(e) => setForm({...form, selling_price: e.target.value})} placeholder="Selling price" className="w-full rounded-xl border border-[#1E3A5F]/10 px-4 py-2.5 text-sm text-[#1E3A5F] outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/25" />
                  <input type="text" value={form.unit} onChange={(e) => setForm({...form, unit: e.target.value})} placeholder="Unit (Pcs, Kg, Ltr)" className="w-full rounded-xl border border-[#1E3A5F]/10 px-4 py-2.5 text-sm text-[#1E3A5F] outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/25" />
                </div>
                <select value={form.category_id} onChange={(e) => setForm({...form, category_id: e.target.value})} className="w-full rounded-xl border border-[#1E3A5F]/10 px-4 py-2.5 text-sm text-[#1E3A5F] outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/25">
                  <option value="">No category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" min="0" value={form.stock_quantity} onChange={(e) => setForm({...form, stock_quantity: e.target.value})} placeholder="Stock qty" className="w-full rounded-xl border border-[#1E3A5F]/10 px-4 py-2.5 text-sm text-[#1E3A5F] outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/25" />
                  <input type="number" min="0" value={form.low_stock_threshold} onChange={(e) => setForm({...form, low_stock_threshold: e.target.value})} placeholder="Low stock threshold" className="w-full rounded-xl border border-[#1E3A5F]/10 px-4 py-2.5 text-sm text-[#1E3A5F] outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/25" />
                </div>
                <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} placeholder="Description (optional)" rows={2} className="w-full rounded-xl border border-[#1E3A5F]/10 px-4 py-2.5 text-sm text-[#1E3A5F] outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/25" />
                <button type="submit" className="w-full rounded-xl bg-[#FF6B35] py-3 text-sm font-semibold text-white shadow-cta hover:bg-[#e55a28]">Create Product</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default POSProducts;
